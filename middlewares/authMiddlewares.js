const { Post, Allocate } = require("../models");

exports.isLoggedIn = (req,res,next)=>{
    if(req.isAuthenticated()){
        next();
    }
    else{
        res.response.isAuth=true;
        next(new Error("로그인이 필요합니다"));
    }
}
exports.isNotLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        next();
    }
    else{
        res.response.isAuth=true;
        next(new Error("이미 로그인 한 상태입니다"));
    }
}
exports.fromServer = (req,res,next)=>{
    const {secret} = require("../message.json");
    if(req.body.secret!=secret){
        res.response.isAuth = true;
        next(new Error("유효한 요청이 아닙니다"));
    }
    else{
        next();
    }
}
exports.isMyPost = async (req, res, next) => {
    try{
        const postId = req.query.id;
        const data = await Post.findAll({raw: true, where: {id: postId, userId: req.user.id}});
        if (data.length === 0) {
            res.response.isAuth=true;
          next(new Error("삭제하려는 게시물이 회원님 것이 아닙니다"));
        } else {
          next();
        }
    }catch(err){
        next(err);
    }
    
}

exports.isMyRoom = async (req,res,next) => {
    try{
        const roomid = req.params.id;
        const data = await Allocate.findAll({raw:true,where:{RoomId:roomid,UserId:req.user.id}});
        if(data.length!=1){
            throw new Error("비정상적인 접근입니다");
        }
        else{
            next();
        }
    }catch(err){
        next(err);
    }
    
}

exports.isMyRoomBody = async (req,res,next)=>{
    try{
        const roomid = req.body.roomId;
        const data = await Allocate.findAll({raw:true,where:{RoomId:roomid,UserId:req.user.id}});
        if(data.length!=1){
            throw new Error("비정상적인 접근입니다");
        }else{
            next();
        }
    }catch(err){
        next(err);
    }
}