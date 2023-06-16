
const express = require("express");
const { isRender, isJson } = require("../middlewares/returnTypeMiddlewares");
const { Like, Comment } = require("../models");
const { Controller } = require("./Controller");
const { isLoggedIn } = require("./middlewares");

module.exports.ExploreController = class ExploreController extends Controller{
    path="/explore";
    initializeRoutes(){
        const router = express.Router();
        router
        .get("/",isRender,isLoggedIn,this.getExplore)
        .get("/list",isJson,isLoggedIn,this.getExplore);
        this.router.use(path,router);
    }

    getExplore = async (req, res, next) => {

        try{
            if (req.query.tag) {
                res.response = {...res.response, view:"explore",model:{hash:req.query.tag}};
            }
            else {
                res.response = {...res.response, view:"explore",model:{hash:undefined}};
            }
            next();

        }catch(err){
            next(err);
        }
        
    }

    getList = async (req, res, next) => {
        try{
            let ret;
            const map = {};
            let list = [];
            const query = req.query.cnt;
            
            const tag = '#' + req.query.tag;
            
        
            if (tag == "#no") {
                const rawQuery = `with tb as (select p.id as postId ,p.createdAt as postCreatedAt ,p.content,u.id as userId,u.nickName,u.profile 
                    from posts p inner join users u on p.userId = u.id order by p.createdAt DESC limit ${query*20},20)   
                    select tb.* , pm.createdAt as postMediaCreatedAt, pm.src, pm.type from postmedia pm inner join tb on tb.postId = pm.postId;`;
                ret = await sequelize.query(rawQuery, { type: QueryTypes.SELECT });
            }
            else  {
                const rawQuery = `with tb as (select p.id as postId ,p.createdAt as postCreatedAt ,p.content,u.id as userId,u.nickName,u.profile 
                    from posts p inner join users u on p.userId = u.id inner join hashtags h on h.PostId = p.id where h.hashtag = '${tag}'
                    order by p.createdAt DESC limit ${query*20},20)   
                    select tb.* , pm.createdAt as postMediaCreatedAt, pm.src, pm.type from postmedia pm inner join tb on tb.postId = pm.postId;`;
                ret = await sequelize.query(rawQuery,{type: QueryTypes.SELECT});

            }

            for (const item of ret){
                if(map.hasOwnProperty(item.postId)){
                    map[item.postId]["src"].push({"src":item.src,"type":item.type});
                }
                else{
                    map[item.postId]={"content":item.content,"createdAt":item.postCreatedAt,"User.id":item.userId,
                    "User.nickName":item.nickName,"User.profile":item.profile,"id":item.postId,
                    "src":[{"src":item.src,"type":item.type}]};
                }
            }

            list = Object.values(map);
            list.sort((a,b)=>b.createdAt-a.createdAt);

        
            for (let i = 0; i < list.length; i++) {
                const likeCnt = await Like.count({ where: { PostId: list[i].id } });
                const commentCnt = await Comment.count({ where: { PostId: list[i].id } });
                list[i].likeCnt = likeCnt;
                list[i].commentCnt = commentCnt
            }

            if (list.length == 0) {
                res.response = {...res.response, code:400,"message":"표시할 게시물이 없어요"};
            }
            else {
                res.response = {...res.respnse, code:200,"message":"게시글을 성공적으로 불러왔어요",data:list};
            }
            next();
        }catch(err){
            next(err);
        }
        
    }

    
}





