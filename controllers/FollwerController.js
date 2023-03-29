const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("./middlewares");
const { QueryTypes } = require('sequelize');
const { sequelize, Follow } = require("../models");
const axios = require("axios");
const {isLoggedIn,isNotLoggedIn } = require("../middlewares/authMiddlewares");
const {isJson,isRender,isRedirect} = require("../middlewares/returnTypeMiddlewares");
const {bodyIdType} =require("../middlewares/typeMiddleware");
const {ip} = require("../message.json");
module.exports.FollowerController = class FollowerController{ //팔로워 관련 처리 컨트롤러
    path = "/recommend";
    router = express.Router();
    constructor(){
        this.initializeRoutes();
    }
    initializeRoutes(){
        const router = express.Router();
        router
        .get("/",isJson,isLoggedIn,getRecommend)
        .post("/follow",isLoggedIn,bodyIdType,handleFollow)
        .post("/unfollow",isLoggedIn,bodyIdType,handleUnfollow)

        this.router.use("/recommend",router);
    }
    getRecommend=async (req, res, next) => { // 팔로워 추천 로직
        try{
            const id = req.user.id;
            const rec_query = `select f2.followed, count(f2.followed) as cnt, u.profile, u.email, u.nickName, u.id
            from follow as f1 join follow as f2 on f1.followed = f2.follower join users as u on f2.followed = u.id
            where f1.follower = "${id}" and f2.followed != "${id}" and f2.followed not in (select followed from follow where follower = "${id}")
            group by f2.followed order by count(f2.followed) desc;`;
            let rec_data = await sequelize.query(rec_query, { type: QueryTypes.SELECT });
            let hasFriend = true;
    
            if (rec_data.length == 0) {
                const rec_top5 = `select u.id, u.profile, u.nickName, u.email, f.followed, count(f.followed) as cnt
                from follow as f join users as u on u.id = f.followed
                where followed not in(select followed from follow where follower = "${id}") and f.followed != "${id}"
                group by f.followed order by count(f.followed) desc limit 5;`;
                rec_data = await sequelize.query(rec_top5, { type: QueryTypes.SELECT });
                hasFriend = false;
            }
            else{
                for (var i = 0; i < rec_data.length; i++) {
                    const rec_query2 = `select nickName
                    from users as u join follow as f on u.id = f.follower
                    where followed = "${rec_data[i].followed}" and follower != "${id}" and follower in (select followed from follow where follower = "${id}");`
                    const rec_data2 = await sequelize.query(rec_query2, { type: QueryTypes.SELECT });
                    rec_data[i].friend = rec_data2[0].nickName;
                };
            }
    
            const data = {
                otherData: rec_data,
                myData: { id: req.user.id, profile: req.user.profile, nickName: req.user.nickName, email: req.user.email },
                hasFriend: hasFriend
            }
            res.response.code=200;
            res.response.data=data;
            res.response.message="추천 리스트를 성공적으로 불러 왔습니다";

        }catch(err){
            next(err);
        }
     };

     handleFollow=async (req, res,next) => { // 팔로우 처리 로직
        try{
            await Follow.create({
                follower: req.user.id,
                followed: req.body.id
            })
            await axios.post(`${ip}/realtime/follow`, { sender: req.user.id, receiver: req.body.id });
            res.response={...res.response,path:"/",message:"성공적으로 팔로우 했습니다"};
        }catch(err){
            next(err);
        }
    };

    handleUnfollow=async (req, res,next) => { // 언팔로우 로직
        try{
            await Follow.destroy({
                where: {
                    follower: req.user.id,
                    followed: req.body.id
                }
            });
            res.response={...res.response,path:"/",message:"성공적으로 언팔로우 했습니다"};
        }catch(err){
            next(err);
        }
        
    };

}


