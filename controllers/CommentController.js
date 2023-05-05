const express = require("express");
const router = express.Router();
const {Comment,User,Post} = require("../models");
const axios = require("axios");
const {ip} =require("../message.json");
const { Controller } = require("./Controller");
const { isJson } = require("../middlewares/returnTypeMiddlewares");
const { isLoggedIn } = require("../middlewares/authMiddlewares");
const { dateTimeConverter } = require("../utility/timeConverter");
//댓글 등록

module.exports.CommentController = class CommentController extends Controller{
    path="/comment";
    initialzieRoutes(){
        const router = express.Router();
        router
        .post("/comments",isJson,isLoggedIn,this.handleComments)
        .get("/comments",isJson,isLoggedIn,this.getComments)
        .get("/commentCount",isJson,isLoggedIn,this.commentCount)
        .delete("/comments",isJson,isLoggedIn,this.deleteComment)
        this.router.use(path,router);
    }

    handleComments = async(req,res,next)=>{ //댓글 등록 로직
        try{
           await Comment.create({
                PostId:req.body.postId,
                UserId:req.user.id,
                comment:req.body.comment
            });
            const target = await Post.findOne({raw:true,where:{id:req.body.postId}});
            await axios.post(`${ip}/realtime/comment`,{PostId:req.body.postId,receiver:target.UserId,sender:req.user.id});
            res.response.code=200;
            res.response.message="댓글을 성공적으로 등록했습니다";
            next();

        }catch(err){
            next(err);
        }
    }
    getComments = async(req,res,next)=>{ //댓글 fetch 로직
        try{
            const come  = await Comment.findAll({
                raw:true,
                attributes:["comment","createdAt","id"],
                include:[{model:User, attributes:["nickName","profile","id"]}],
                where:{
                        PostId:req.query.PostId},
                order: [['createdAt','DESC']],
            
            });

            come.forEach(ele=>{
                if(ele['User.id']==req.user.id){
                    ele.me='true';
                }
            }); //자기 댓글은 me='true'로 표시함

            come.forEach(dateTimeConverter);
            res.response.data=come;
            res.response.code=200;
            res.response.message="댓글을 성공적으로 불러왔습니다";
            next();
        }catch(err){
            next(err);
        }
    }
    commentCount = async(req,res,next)=>{ //댓글 개수 카운트 로직
        try{
            const count  = await Comment.findAll({
                raw:true,
                attributes:["comment","createdAt","id"],
                include:[{model:User, attributes:["nickName","profile","id"]}],
                where:{
                        PostId:req.query.PostId}
            });
            res.response.data=count;
            res.response.code=200;
            next();
        }catch(err){
            next(err);
        }
    }
    deleteComment = async(req,res,next)=>{ //댓글 삭제 로직
        try{
            const result = await Comment.findAll({where:{UserId:req.user.id, id:req.body.id}});
            if(result.length==1){
                await Comment.destroy({
                where:{id:req.body.id}
                });
                res.response.message="댓글을 성공적으로 삭제 했습니다";
                res.response.code=200;
        }
        else{
            res.response.message="비정상적인 접근 입니다";
            res.response.code=400;
        }
        next();
        }catch(err){
            next(err);
        }
        
    }
}
















