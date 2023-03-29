const express = require("express");
const router = express.Router();
const {Comment,User,Post} = require("../models");
const axios = require("axios");
const {ip} =require("../message.json");
//댓글 등록
router.post("/comments",async(req,res)=>{ 

    const comments = await Comment.create({
        PostId:req.body.postId,
        UserId:req.user.id,
        comment:req.body.comment
    });
    const target = await Post.findOne({raw:true,where:{id:req.body.postId}});
    await axios.post(`${ip}/realtime/comment`,{PostId:req.body.postId,receiver:target.UserId,sender:req.user.id});
    res.send({code:200});
})

//댓글 불러오기

router.get("/comments",async(req,res)=>{
    const come  = await Comment.findAll({
        raw:true,
        attributes:["comment","createdAt","id"],
        include:[{model:User, attributes:["nickName","profile","id"]}],
        where:{
                PostId:req.query.PostId},
        order: [['createdAt','DESC']],
    
    });
    come.forEach(ele=>{
        console.log(ele['User.id']);
        console.log(req.user.id);
        if(ele['User.id']==req.user.id){
            ele.me='true';
        }
    });
    const now = new Date().getTime();
    come.forEach(ele=>{
        if(now-ele.createdAt.getTime()>3600*1000 && now-ele.createdAt.getTime()<3600*1000*24){
            ele.time=`${parseInt(parseInt((now-ele.createdAt.getTime())/1000)/3600)}시간전`;
        }
        else if(now-ele.createdAt.getTime()>=3600*1000*24){
            ele.time=`${parseInt(parseInt((now-ele.createdAt)/1000)/(86400))}일전`;
        }
        else if(now-ele.createdAt.getTime()<=60*1000){
            ele.time=`${parseInt((now-ele.createdAt.getTime())/1000)}초전`;
        }
        else{
            ele.time=`${parseInt(parseInt((now-ele.createdAt.getTime())/1000)/60)}분전`;
        }
    });
    res.send(come);
})



//댓글 카운트
router.get("/commentCount", async(req,res)=>{
    const Count  = await Comment.findAll({
        raw:true,
        attributes:["comment","createdAt","id"],
        include:[{model:User, attributes:["nickName","profile","id"]}],
        where:{
                PostId:req.query.PostId}
    });
    res.send(Count);
})



//댓글 리스트
router.get("/commentList", async(req,res)=>{
    const come  = await Comment.findAll({
        raw:true,
        attributes:["comment","createdAt","id"],
        include:[{model:User, attributes:["nickName","profile","id"]}],
        where:{
                PostId:req.query.PostId},
        order: [['createdAt','DESC']]
    });
    come.forEach(ele=>{
        console.log(ele['User.id']);
        console.log(req.user.id);
        if(ele['User.id']==req.user.id){
            ele.me='true';
        }
    });
    const now = new Date().getTime();
    come.forEach(ele=>{
        if(now-ele.createdAt.getTime()>3600*1000 && now-ele.createdAt.getTime()<3600*1000*24){
            ele.time=`${parseInt(parseInt((now-ele.createdAt.getTime())/1000)/3600)}시간전`;
        }
        else if((now-ele.createdAt.getTime())>=3600*1000*24){
            console.log((now-ele.createdAt)/1000)
            ele.time=`${parseInt(parseInt((now-ele.createdAt)/1000)/(86400))}일전`
        }
        else if(now-ele.createdAt.getTime()<=60*1000){
            ele.time=`${parseInt((now-ele.createdAt.getTime())/1000)}초전`;
        }
        else{
            ele.time=`${parseInt(parseInt((now-ele.createdAt.getTime())/1000)/60)}분전`;
        }
    });
    res.send(come);
})


//댓글 삭제
router.post("/commentDelete",async(req,res)=>{
    console.log(req.body.id);
    await Comment.destroy({
        where:{id:req.body.id}
    });
    res.send({code:200});
})

module.exports = router;