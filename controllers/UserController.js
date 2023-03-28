const express= require("express");
const { isLoggedIn } = require("./middlewares");
const { QueryTypes } = require('sequelize');
const { sequelize } = require("../models");
const {Sequelize:{Op}} = require("sequelize");
const {Notification,User} = require("../models");
const {isLoggedIn,isNotLoggedIn } = require("../middlewares/authMiddlewares");
const {isJson,isRender} = require("../middlewares/typeMiddlewares");
const {timeConverter} = require("../utility/timeConverter");

module.exports.UserController=class UserController{ // 검색 및 알림 공통기능 컨트롤러
    router = express.Router();
    constructor(){
        const router = this.router;
        router
        .get("/",isJson,isLoggedIn,searchUser)
        .get("/notification",isJson,isLoggedIn,getNotificationCount)
        .get("/notificationInfo",isJson,getNotificationInfo)
        this.router.use("/user",router);
    }

    searchUser = async (req,res,next)=>{ // 상단 검색창에서 유저나 이메일을 검색하는 로직
        try{
            const info = req.query.search;
            const query = `SELECT id, nickName, email, profile FROM users WHERE nickName LIKE "${info}%" OR email LIKE "${info}%"`;
            const arr = await sequelize.query(query, {type: QueryTypes.SELECT});
            res.response.data=arr;
            res.response.code=200;
            next();
        }catch(err){
            next(err);
        }
        
    };
    getNotificationCount= async(req,res,next)=>{ //상단 나에게 온 알림이 몇 개인지 검색하는 로직
        try{
            const result = await Notification.findAll({where:{receiver:req.user.id, reached:"false", type: {[Op.ne]:"chat"},}});
            res.response.code=200;
            res.response.data=resulst.length;
            next();
        }
        catch(err){
            next(err);
        }
        
    };
    getNotificationInfo=async(req,res,next)=>{ // 상단의 알림을 클릭해서 알림을 확인하는 로직
        try {
          const now = new Date().getTime();
          const filtered = await Notification.findAll({
            raw: true,
            where: {
              type: { [Op.ne]: "chat" },
              receiver: req.user.id,
              createdAt: { [Op.gt]: now - 3600 * 25 * 1000 },
            },
            order: [['createdAt', 'DESC']],
            include: [
              { model: User, as: "send", attributes: ["nickName", "profile"] },
            ],
          });
          await Notification.update(
            { reached: "true" },
            { where: { receiver: req.user.id } }
          );
          filtered.forEach(timeConverter);
          res.response.data=filtered;
          next();
        } catch (err) {
          next(err);
        }
      }

}






