const express = require("express");
const router = express.Router();
const {User,Post,PostMedia,Follow,Comment,Like,BookMark} = require("../models");
const { Op } = require('sequelize');
const {isLoggedIn,isNotLoggedIn } = require("../middlewares/authMiddlewares");
const {isJson,isRender} = require("../middlewares/typeMiddlewares");

class MainController{
    router = express.Router();
    path="/main";
    constructor(){
        this.initializeRoutes();
    }
    initializeRoutes(){
        const router = express.Router();
        router
        .get("/",isRender,this.getMain)
        .get("/fpost",isJson,isLoggedIn,getPost)
        this.router.use(this.path,this.router);
    }
    getMain = async(req,res) =>{ // 메인 페이지를 렌더하는 로직
        try{
            if(req.isAuthenticated()){
                const postList = await Post.findAll({
                    raw: true,
                    where: {
                      UserId: {
                        [Op.in]: [req.user.id, ...(await Follow.findAll({ raw: true, where: { follower: req.user.id }, attributes: ['followed'] })).map(f => f.followed)]
                      }
                    }
                  });
                postList.length == 0 ? res.response={...res.response,model:{code:400},view:"main"} : res.response={...res.response,model:{code:200},view:"main"};
                next();
            }
            else{
                res.response={...res.response,type:"redirect",path:"/auth/login"}; //미인증 사용자 redirect
                next();
            }
        }catch(err){
            
            next(err);
        }
        
    }
    getPost = async(req,res,next)=>{ //게시물 fetch로직
        try{
            let paginatedList = [];
            const offset = req.query.cnt * 5 - 1;
            const followingList = await User.findAll({
            raw: true,
            attributes: ['id'],
            include: [{ model: User, as: 'followings', where: { id: req.user.id } }]
            });
            followingList.push({id:req.user.id});
            //자신의 팔로워와 자신을 포함한 리스트 (전처리)
            paginatedList = handlePost(followingList,offset); //paginatedList에는 시간 순으로 정렬된 게시글이 담김
            handleDate(paginatedList); //paginatedList의 시간을 가공함 
            handleLike(paginatedList); //paginatedList의 좋아요를 가공함
            handleBookMark(paginatedList);  //paginatedList의 북마크를 가공함
            handleComment(paginatedList); // paginatedList의 댓글을 가공함
            if(paginatedList.length==0){
                res.response={code:400,message:"가져올 게시글이 없어요",...res.response}; 
            }
            else{
                res.response={code:200,data:paginatedList,message:"성공적으로 게시글을 전송했어요",...res.response};
            }
            return next();
        }catch(err){
            next(err);
        }
            
            
            // 데이터 가공
            /* 데이터 형식
            {   
        
                content: , 
                createdAt: ,
                'User.nickName': , 
                'User.profile': ,
                'User.id',
                src: [{src: , type},]
            }
        
            */
    }
    
    
}














//자기가 팔로잉 중인 사람들의 게시글을 offset에 맞게 가져오는 함수
const handlePost = async(followingList,offset)=>{
    const postIds=new Set();
    const postList=[];
    for (let i=0; i<followingList.length; i++) {
        const followingPost = await Post.findAll({
        raw:true,
        attributes:['content','createdAt','id'],
        where:{UserId: followingList[i].id},
        include: [{model:PostMedia,attributes:['createdAt','type','src']},{model:User,attributes:['id','nickName','profile']}]
        });
        followingPost.forEach(post => {
            if (!postIds.has(post.id)) {
                postList.push({
                    id: post.id,
                    content: post.content,
                    createdAt: post.createdAt,
                    User: post.User,
                    Postmedia: post.Postmedia 
                        .sort((a, b) => b.createdAt - a.createdAt) 
                        .map(item => ({ 
                            createdAt: item.createdAt,
                            type: item.type,
                            src: item.src
                        }))
                });
                postIds.add(post.id);
            } 
            else {
                const index = postList.findIndex(item => item.id === post.id);
                postList[index].Postmedia.push({
                    createdAt: post['Postmedia.createdAt'],
                    type: post['Postmedia.type'],
                    src: post['Postmedia.src']
                });
            }
            });
    }
    return postList
        .sort((a,b) => b.createdAt - a.createdAt) 
        .slice(offset, offset + 5);
}
//시간을 가공하는 함수
const  handleDate = (list)=>{
    for(let i=0;i<list.length;i++){
        let date = list[i].createdAt;
        let sendDate = date.getFullYear()+'년 '+(parseInt(date.getMonth())+1)+'월 '+date.getDate()+"일 ";         
        if(date.getHours()<12){
            sendDate+="오전 "+date.getHours()+"시 ";
        }
        else{
            sendDate+='오후 '+(parseInt(date.getHours())-12)+"시 ";
        }
        sendDate+=+date.getMinutes()+"분";
        list[i].createdAt=sendDate;
        delete list[i]['Postmedia.createdAt'];
        delete list[i]['Postmedia.type'];
        delete list[i]['Postmedia.src'];
    }
}
//좋아요 가공 함수
const handleLike = async(list)=>{
    for(let i=0;i<list.length;i++){
        const data = await Like.findAll({where:{UserId:req.user.id,PostId:list[i].id}});
        const cnt = await Like.findAll({where:{PostId:list[i].id}});
        list[i].likeCount= cnt.length;
        if(data.length!=0){
            list[i].like='true';
        }
    }
}
//북마크 가공 함수
const handleBookMark = async(list)=>{

    for(let i=0;i<list.length;i++){
        const data = await BookMark.findAll({where:{UserId:req.user.id, PostId:list[i].id}});
        if (data.length!=0){
            list[i].bookmark = 'true';
        }
    }
}

//댓글 수 가공 함수
const handleComment = async(list)=>{
    for(let i=0;i<list.length;i++){
        if(list[i]['User.id']==req.user.id){
            list[i].myPost ="true";
        }
        const Count  = await Comment.findAll({
            raw:true,
            attributes:["comment","createdAt","id"],
            include:[{model:Post}],
            where:{PostId:list[i].id},
        });
        list[i].commentCount= Count.length;
    }
}

module.exports.MainController = MainController;