const express = require("express");
const router = express.Router();
const axios = require("axios");
const path = require("path");
const {User,Room,Allocate,Chat,Notification} = require("../models");
const {isJson,isRender, isMyRoom, isMyRoomBody} = require("../middlewares/authMiddlewares");
const {isLoggedIn, isNotLoggedIn} = require("./middlewares");
const { QueryTypes } = require('sequelize');
const { sequelize } = require("../models");
const {Sequelize:{Op}} = require("sequelize");
const {dateTimeConverter, KSTConverter} = require("../utility/timeConverter");
const multer = require("multer");
const {v4:uuidv4}=require('uuid');
const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, 'uploads/');
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            done(null, uuidv4() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024*1024*1024 },
})
const {ip} = require("../message.json");
const { queryIdType, queryCntType,queryOffsetType } = require("../middlewares/typeMiddleWares");

module.exports.ChatController = class ChatController{
    path="/chat";
    initializeRoutes(){
        const router = express.Router();
        router
        .get("/",isRender,isLoggedIn,this.getChat)
        .get("/enter",isJson,isLoggedIn,queryIdType,this.enter)
        .get("/room/:id",isRender,isLoggedIn,isMyRoom,this.getRoom)
        .get("/comment",isJson,isLoggedIn,queryIdType,queryCntType,queryOffsetType,this.getComment)
        .post("/chat",isJson,isLoggedIn,isMyRoomBody,this.handleChat)
        .get("/chatnoti",isJson,isLoggedIn,this.handleChatNoti);
        this.router.use(path,router);
    }

    getChat = async(req,res,next)=>{
        try{
            const users = await User.findAll({raw:true,include:[{model:User,as:"followings",attributes:['id','email','nickName','profile','comment'],where:{id:req.user.id}}]});//팔로잉 정보
            const query = `select * from rooms inner join allocate on allocate.RoomId = rooms.id inner join users on allocate.UserId= users.id where users.id = "${req.user.id}" order by rooms.time`;
            const ret = await sequelize.query(query,{type:QueryTypes.SELECT});
            dateTimeConverter(ret);

            for(let i=0; i<arr.length; i++){
                const query = `select * from notifications where RoomId="${ret[i].RoomId}" and receiver = "${req.user.id}" and reached="false"`;
                const data = await sequelize.query(query,{type:QueryTypes.SELECT});
                ret[i].chatCnt = data.length;
            }
            res.response = {...res.response,view:"chat",model:{data:users,room:ret}};
            next();

        }catch(err){
            next(err);
        }
    }

    enter = async(req,res,next)=>{
        try{
            if(req.query.id == req.user.id){
                throw new Error("비정상적인 접근입니다");
            }
            const query = `select a.RoomId as roomId  from allocates a where a.UserId = “${req.user.id}”
            and exists (select 1 from allocates b where b.UserId=“${req.query.id}”
            and a.RoomId = b.RoomId)`;
            const arr = await sequelize.query(query,{type:QueryTypes.SELECT});
            if(arr.length!=0){
                res.response={...res.response,code:200,message:"채팅방 url을 성공적으로 찾았습니다",data:{url:`/chat/room/${arr[0].roomId}`}}; 
                next();
            }
            else{
                const data = await Room.create({type:"one",time:new Date()});
                await Allocate.create({UserId:req.user.id,RoomId:data.dataValues.id});
                await Allocate.create({UserId:req.query.id,RoomId:data.dataValues.id});
                await axios.post(`${ip}/realtime/room`,{id:req.query.id,user:req.user}); 
                res.response={...res.response,code:200,message:"채팅방 url을 성공적으로 찾았습니다",data:{url:`/chat/room/${data.dataValues.id}`}}; 
                next();
            }
        }catch(err){
            next(err);
        }
       
    };

    getRoom =async(req,res,next)=>{
        try{
            await Notification.update({reached:"true"},{where:{RoomId:req.params.id,receiver:req.user.id}});
            await Chat.update({reached:"true"},{where:{RoomId:req.params.id,UserId:{[Op.ne]:req.user.id}}});
            const query = `select * from users inner join allocate on users.id=allocate.UserId where allocate.RoomId="${req.params.id}" and users.id!="${req.user.id}"`;
            const data = await sequelize.query(query,{type:QueryTypes.SELECT});
            res.response = {...res.response, view:"room",code:200, data:{id:req.params.id,data:data,me:req.user.id}};
            next();
        }catch(err){
            next(err);
        }
    };

    getComment = async(req,res,next)=>{
        try{
            const id = req.query.id;
            const cnt = req.query.count;
            const offset = req.query.offset;
            const num = parseInt(cnt)*10+parseInt(offset);
            const query = `select * from chats inner join users on users.id=chats.UserId where chats.RoomId="${id}" order by chats.createdAt DESC limit ${10} offset ${num} `;
            const data = await sequelize.query(query,{type:QueryTypes.SELECT});
            KSTConverter(data);

            if(data.length==0){
                res.response = {code:400,data:data,message:"불러올 채팅 내역이 없습니다"};
            }
            else{
                res.response = {code:200,data:data,message:"채팅을 성공적으로 불러 왔습니다"}; 
            }
            next();
        }
        catch(err){
            next(err);
        }
    };

    handleChat = async (req,res,next)=>{
        try{
            await Room.update({time:new Date()},{where:{id:req.body.roomId}});
            const socketQuery = `select *  from sessionSocketIdMap inner join allocate on sessionSocketIdMap.UserId = allocate.UserId inner join rooms on rooms.id = allocate.RoomId where rooms.id="${req.body.roomId}" and sessionSocketIdMap.UserId !="${req.user.id}"`;
            const socketResult =  await sequelize.query(socketQuery,{type:QueryTypes.SELECT});
        
            const targetQuery = `select *  from allocate where UserId!="${req.user.id}" and RoomId="${req.body.roomId}"`;
            const target =  await sequelize.query(targetQuery,{type:QueryTypes.SELECT});
           
            const onChatQuery = `select *  from sessionSocketIdMap inner join allocate on sessionSocketIdMap.UserId = allocate.UserId inner join rooms on rooms.id = allocate.RoomId where rooms.id="${req.body.roomId}" and sessionSocketIdMap.UserId !="${req.user.id}" and sessionSocketIdMap.type="${req.body.roomId}"`;
            const onChatResult = await sequelize.query(onChatQuery,{type:QueryTypes.SELECT});
        
            
            const reached = onChatResult.length == 0 ? "fasle" : "true"; 
            
        
            //간단한 시간 변환
            let now = new Date();
            let date = now;
            let sendDate = date.getFullYear()+'년 '+(parseInt(date.getMonth())+1)+'월 '+date.getDate()+"일 ";         
            if(date.getHours()<12){
                sendDate+="오전 "+date.getHours()+"시 ";
            }
            else{
                sendDate+='오후 '+(parseInt(date.getHours())-12)+"시 ";
            }
            sendDate+=+date.getMinutes()+"분";
        
            // room namespace에 알림을 보냄
            req.app.get("io").of("/room").to(req.headers.referer).emit("message",{profile:req.user.profile, nickName:req.user.nickName,content:req.body.content, UserId:req.user.id,reached:reached,time:sendDate});
            await Chat.create({content:req.body.content, type:"one",UserId:req.user.id,RoomId:req.body.roomId,reached:reached});
            await Notification.create({reached:reached, type:"chat", sender:req.user.id, receiver: target[0].UserId ,RoomId:req.body.roomId });
            
            
            const notificationQuery = `select *  from sessionSocketIdMap inner join allocate on sessionSocketIdMap.UserId = allocate.UserId inner join rooms on rooms.id = allocate.RoomId where rooms.id="${req.body.roomId}" and sessionSocketIdMap.UserId !="${req.user.id}" and sessionSocketIdMap.type="notification"`;
            const notificationResult  =  await sequelize.query(notificationQuery,{type:QueryTypes.SELECT});
        
            notificationResult.forEach(ele=>{
                req.app.get("io").of("/notification").to(ele.socketId).emit("chatNoti");
            });
        
        
            const roomQuery = `select rooms.time, rooms.id  from rooms inner join allocate on allocate.RoomId = rooms.id where rooms.id="${req.body.roomId}" and rooms.type="one"`;
            const roomData =  await sequelize.query(roomQuery,{type:QueryTypes.SELECT});
            now = new Date().getTime();
          
            if(now-roomData[0].time.getTime()>3600*1000 && now-roomData[0].time.getTime()<3600*1000*24){
                roomData[0].time=`${parseInt(parseInt((now-roomData[0].time.getTime())/1000)/3600)}시간전`;
            }
            else if(now-roomData[0].time.getTime()>=3600*1000*24){
                roomData[0].time=`${parseInt(parseInt((now-roomData[0].time)/1000)/(86400))}일전`;
            }
            else if(now-roomData[0].time.getTime()<=60*1000){
                roomData[0].time=`${parseInt((now-roomData[0].time.getTime())/1000)}초전`;
            }
            else{
                roomData[0].time=`${parseInt(parseInt((now-roomData[0].time.getTime())/1000)/60)}분전`;
            }
        
            const chatCntQuery = `select * from notifications where notifications.RoomId="${req.body.roomId}" and receiver != "${req.user.id}" and reached="false" `;
            const chatCntResult  =  await sequelize.query(chatCntQuery,{type:QueryTypes.SELECT});
        
            for(let i =0;i<socketResult.length;i++){
                socketResult[i].chatCnt=chatCntResult.length;
            }
            socketResult.forEach(ele=>{
                req.app.get("io").of("/chat").to(ele.socketId).emit("chat",{id:req.user.id,nickName:req.user.nickName, email:req.user.email,profile:req.user.profile,RoomId:roomData[0].id,time:roomData[0].time,chatCnt:ele.chatCnt});
            });
            res.response={...res.response,code:200,meesage:"성공적으로 채팅을 처리하였습니다"};
        

        }catch(err){
            next(err);
        }
    };
    handleChatNoti=async(req,res,next)=>{
        try{
            if(req.user){
                const data = await Notification.findAll({raw:true,where:{type:"chat",reached:"false",receiver:req.user.id}});
                res.response = {...res.response,data:{cnt:data.length},code:200}; 

            }
            else{
                res.response = {...res.response,data:{cnt:0},code:200}; 
            }
            next();
        }catch(err){
            next(err);
        }
        
    };
    
}























router.post("/image/:roomId",upload.single("image"),async(req,res,next)=>{
    console.log(req.body);
    await Room.update({time:new Date()},{where:{id:req.params.roomId}});
    const query2 = `select *  from sessionSocketIdMap inner join allocate on sessionSocketIdMap.UserId = allocate.UserId inner join rooms on rooms.id = allocate.RoomId where rooms.id="${req.params.roomId}" and sessionSocketIdMap.UserId !="${req.user.id}"`;
    const result =  await sequelize.query(query2,{type:QueryTypes.SELECT});
    const query3 = `select *  from sessionSocketIdMap inner join allocate on sessionSocketIdMap.UserId = allocate.UserId inner join rooms on rooms.id = allocate.RoomId where rooms.id="${req.params.roomId}" and sessionSocketIdMap.UserId !="${req.user.id}" and sessionSocketIdMap.type="${req.params.roomId}"`;
    const result3 =  await sequelize.query(query3,{type:QueryTypes.SELECT});
    const query1 = `select *  from allocate where UserId!="${req.user.id}" and RoomId="${req.params.roomId}"`;
    const result1 =  await sequelize.query(query1,{type:QueryTypes.SELECT});
    if(result3.length!=0){
        const now = new Date();
        let date = now;
        let sendDate = date.getFullYear()+'년 '+(parseInt(date.getMonth())+1)+'월 '+date.getDate()+"일 ";         
        if(date.getHours()<12){
            sendDate+="오전 "+date.getHours()+"시 ";
        }
        else{
            sendDate+='오후 '+(parseInt(date.getHours())-12)+"시 ";
        }
        sendDate+=+date.getMinutes()+"분";
        req.app.get("io").of("/room").to(req.headers.referer).emit("image",{profile:req.user.profile, nickName:req.user.nickName, UserId:req.user.id,reached:"true",time:sendDate,src:"/"+req.file.path});
        await Chat.create({ type:"one",UserId:req.user.id,RoomId:req.params.roomId,reached:"true",src:"/"+req.file.path});
        await Notification.create({reached:"true", type:"chat", sender:req.user.id, receiver: result1[0].UserId ,RoomId:req.params.roomId });
    }
    else{
        const now = new Date();
        let date = now;
        let sendDate = date.getFullYear()+'년 '+(parseInt(date.getMonth())+1)+'월 '+date.getDate()+"일 ";         
        if(date.getHours()<12){
            sendDate+="오전 "+date.getHours()+"시 ";
        }
        else{
            sendDate+='오후 '+(parseInt(date.getHours())-12)+"시 ";
        }
        sendDate+=+date.getMinutes()+"분";
        req.app.get("io").of("/room").to(req.headers.referer).emit("image",{profile:req.user.profile, nickName:req.user.nickName, UserId:req.user.id,reached:"false",time:sendDate,src:"/"+req.file.path});
        await Chat.create({ type:"one",UserId:req.user.id,RoomId:req.params.roomId,reached:"false",src:"/"+req.file.path});
        await Notification.create({reached:"false", type:"chat", sender:req.user.id, receiver: result1[0].UserId ,RoomId:req.params.roomId });
    }
    const query4 = `select *  from sessionSocketIdMap inner join allocate on sessionSocketIdMap.UserId = allocate.UserId inner join rooms on rooms.id = allocate.RoomId where rooms.id="${req.params.roomId}" and sessionSocketIdMap.UserId !="${req.user.id}" and sessionSocketIdMap.type="notification"`;
    const result4 =  await sequelize.query(query4,{type:QueryTypes.SELECT});
    result4.forEach(ele=>{
        req.app.get("io").of("/notification").to(ele.socketId).emit("chatNoti");
    });
    const query = `select rooms.time, rooms.id  from rooms inner join allocate on allocate.RoomId = rooms.id where rooms.id="${req.params.roomId}" and rooms.type="one"`;
    const data =  await sequelize.query(query,{type:QueryTypes.SELECT});
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
    for(let i =0;i<result.length;i++){
        const query2 = `select * from notifications where notifications.RoomId="${req.params.roomId}" and receiver != "${req.user.id}" and reached="false" `;
        const result2 =  await sequelize.query(query2,{type:QueryTypes.SELECT});
        result[i].chatCnt=result2.length;
    }
    result.forEach(ele=>{
        req.app.get("io").of("/chat").to(ele.socketId).emit("chat",{id:req.user.id,nickName:req.user.nickName, email:req.user.email,profile:req.user.profile,RoomId:data[0].id,time:data[0].time,chatCnt:ele.chatCnt});
    });
    res.send({code:200});
});

