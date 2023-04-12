const express= require("express");
const router = express.Router();
const {Notification,Post,SessionSocketIdMap,User} = require("../models");
const { QueryTypes } = require('sequelize');
const { sequelize } = require("../models");
const {Controller} = require("./Controller");
const {fromServer,isLoggedIn} = require("../middlewares/authMiddlewares");
const {bodySenderReceiverType,bodyPostIdType,queryIdType} = require("../middlewares/typeMiddleWares");

const { isJson } = require("../middlewares/returnTypeMiddlewares");

//컨트롤러에서 소켓을 사용하기 위한 컨트롤러
module.exports.RealTimeController= class RealTimeController extends Controller{
    path="/realtime";
    initializeRoutes(){
        const router = express.Router();
        router
        .post("/like",isJson,fromServer,bodySenderReceiverType,this.handleLike)
        .post("/follow",isJson,fromServer,bodySenderReceiverType,this.handleFollow)
        .post("/comment",isJson,fromServer,bodySenderReceiverType,bodyPostIdType,this.handleActive)
        .get("/active",isJson,isLoggedIn,queryIdType,this.handleActive)
        .post("/room",isJson,fromServer,this.handleRoom);
        this.router.use(path,router);
    }
    handleLike=(req,res,next)=>{ //좋아요를 실시간으로 알려주는 로직
        try{
            const result = await Post.findOne({raw:true,where:{id:req.body.receiver}});
            await Notification.create({sender:req.body.sender, receiver:result.UserId, type:"like", reached:"false",PostId:result.id});
            const socketId = await SessionSocketIdMap.findAll({raw:true,where:{UserId:result.UserId,type:"notification"}});
            socketId.forEach(ele=>{
                req.app.get("io").of("/notification").to(ele.socketId).emit("notification");
            });
            res.response.code=200;
            res.response.message="좋아요 알림을 성공적으로 보냈습니다";
            next();
        }catch(err){
            next(err);
        }
    }
    handleFollow=(req,res,next)=>{ //팔로우를 실시간으로 알려주는 로직
        try{
            await Notification.create({sender:req.body.sender, receiver:req.body.receiver, type:"follow", reached:"false"});
            const socketId = await SessionSocketIdMap.findAll({raw:true,where:{UserId:req.body.receiver,type:"notification"}});
            socketId.forEach(ele=>{
                req.app.get("io").of("/notification").to(ele.socketId).emit("notification");
            });
            res.response.code=200;
            res.response.message="팔로우 알림을 성공적으로 보냈습니다";
        }catch(err){
            next(err);
        }
    }
    handleComment=(req,res,next)=>{ //댓글을 실시간으로 알려주는 로직
        try{
            await Notification.create({sender:req.body.sender,receiver:req.body.receiver,type:"comment",reached:"false",PostId:req.body.postId});
            const socketId = await SessionSocketIdMap.findAll({raw:true,where:{UserId:req.body.receiver,type:"notification"}});
            socketId.forEach(ele=>{
                req.app.get("io").of("/notification").to(ele.socketId).emit("notification");
            });
            res.response.code=200;
            res.response.message="댓글 알림을 성공적으로 보냈습니다";
            next();
        }catch(err){
            next(err);
        }
    }
    handleActive=(req,res,next)=>{ // 현재 사용자가 접속 중인지를 알려주는 로직
        try{
            const result = await SessionSocketIdMap.findAll({raw:true,where:{UserId:req.query.id}});
            res.response.code=200;
            res.response.message="성공적으로 활동여부를 불러 왔습니다";
            if(result.length!=0){
                res.response.data={active:"true"}
            }
            else{
                res.response.data={active:"false"}
            }
            next();
        }catch(err){
            next(err);
        }
    }
    room=async(req,res,next)=>{ // 채팅이오면 채팅방의 순서를 재정렬하는 로직
        try{
            const result = await SessionSocketIdMap.findAll({raw:true,where:{UserId:req.body.id,type:"chat"}});
            const query = `select rooms.time, rooms.id  from rooms inner join allocate on allocate.RoomId = rooms.id where allocate.UserId="${req.body.id}" or allocate.UserId="${req.body.user.id}" and rooms.type="one" `;
            const re =  await sequelize.query(query,{type:QueryTypes.SELECT});
            let data = [];
            for (let i=0; i<re.length;i++){
                const query = `select allocate.UserId from allocate where allocate.RoomId="${re[i].id}"`;
                const temp =  await sequelize.query(query,{type:QueryTypes.SELECT});
                if(temp.length==2){
                    if(temp[0].UserId==req.body.id&&temp[1].UserId==req.body.user.id){
                        data.push(re[i]);
                    }
                    if(temp[1].UserId==req.body.id&&temp[0].UserId==req.body.user.id){
                        data.push(re[i]);
                    }
                }
            }
        
            const now = new Date().getTime();
            if(now-data[0].time.getTime()>3600*1000 && now-data[0].time.getTime()<3600*1000*24){
                data[0].time=`${parseInt(parseInt((now-data[0].time.getTime())/1000)/3600)}시간전`;
            }
            else if(now-data[0].time.getTime()>=3600*1000*24){
                data[0].time=`${parseInt(parseInt((now-data[0].time)/1000)/(86400))}일전`;
            }
            else if(now-data[0].time.getTime()<=60*1000){
                data[0].time=`${parseInt((now-data[0].time.getTime())/1000)}초전`;
            }
            else{
                data[0].time=`${parseInt(parseInt((now-data[0].time.getTime())/1000)/60)}분전`;
            }
        
            result.forEach(ele=>{
                req.app.get("io").of("/chat").to(ele.socketId).emit("room",{id:req.body.user.id,nickName:req.body.user.nickName, email:req.body.user.email,profile:req.body.user.profile,RoomId:data[0].id,time:data[0].time});
            });
            res.code=200;
            res.message="채팅방 순서를 성공적으로 재정렬 했습니다";
            next();
        }catch(err){
            next(err);
        }
        
    }
}

















