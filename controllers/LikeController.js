
const express = require("express");
const router = express.Router();
const {Like,User} = require("../models");
const { QueryTypes } = require("sequelize");
const { sequelize } = require("../models/index");
const axios = require("axios");
const { isLoggedIn, isNotLoggedIn } = require("../middlewares/authMiddlewares");
const {isJson,isRender} = require("../middlewares/returnTypeMiddlewares");
const {ip} = require("../message.json");
const {bodyPostIdType,queryPostIdType} =require("../middlewares/typeMiddleWares"); 
const {Controller} = require("./Controller");
module.exports.LikeController = class LikeController extends Controller{ // 좋아요 컨트롤러

    path="/like";
   
    initializeRoutes(){
        const router = express.Router();
        router
        .post("/",isJson,isLoggedIn,bodyPostIdType,handleLike)
        .get("/likeCount",isJson,isLoggedIn,queryPostIdType,getLikeCount)
        .get("/list",isJson,isLoggedIn,queryPostIdType,getList);
        this.router.use(path,router);

    }
    handleLike=async(req,res,next)=>{
        try{
            const likes = await Like.findAll({
                raw: true,
                where:{ PostId:req.body.postId, UserId:req.user.id }
            });
            if(!likes.length==0){
                await Like.destroy({
                    where:{PostId:req.body.postId, UserId:req.user.id}
                });
                res.response.code=200;
                res.response.message="좋아요를 성공적으로 취소했습니다";
            }
            else{
                await Like.create(
                    {PostId:req.body.postId, UserId:req.user.id}
                );
                await axios.post(`${ip}/realtime/like`,{sender:req.user.id,target:req.body.postId}); //알림용
                res.response.code=200;
                res.response.mssage="좋아요를 성공적으로 등록했습니다";
            }
        }catch(err){
            next(err);
        }
    };

    getLikeCount=async(req,res,next)=>{
        try{
            const likeCount = await Like.findAll({
                raw: true,
                where:{PostId:req.query.PostId}
            });
            res.response.data=likeCount.length;
            res.response.code=200;
            res.response.message="좋아요 개수를 성공적으로 가져왔습니다";
        }catch(err){
            next(err);
        }
        
        
    };

    getList=async(req,res,next)=>{
        try{
            const query = `select users.*,likes.*
            from users inner join likes
            on users.id = likes.UserId
            where likes.PostId = "${req.query.PostId}";`
            const result = await sequelize.query(query,{type:QueryTypes.SELECT});
            res.response.data=result;
            res.response.code=200;
            res.response.message="성공적으로 좋아요를 누른 사람의 목록을 가져왔습니다";
            next();
        }catch(err){
            next(err);
        }
        
    };
}





