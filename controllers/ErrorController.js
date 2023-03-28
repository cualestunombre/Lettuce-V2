const express = require("express");


class ErrorController{
    router=express.Router();
    constructor(){
        this.initializeRoutes();
    }
    initializeRoutes(){
        const router = express.Router();
        router.use(terminalResponse);
    }
    handleError = (err,req,res,next)=>{
        //에러 로그 작성
        const isAuth = res.response.isAuth;
        if(res.response.type=="render"){
            if(isAuth){
                res.status(400).render("error",{error:err.message});
            }
            else{
                res.status(500).render("error",{error:"내부 서버에러가 발생했습니다ㅠㅠ"});
            }
            
        }
        else{
            if(isAuth){
                res.status(400).send({code:400,message:err.message});
            }
            else{
                res.status(500).send({code:500,message:"내부 서버에러가 발생했습니다ㅠㅠ"});
            }
        }
        
    }
    
    
}

module.exports.ErrorController = ErrorController;