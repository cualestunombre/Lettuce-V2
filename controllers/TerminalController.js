const express = require("express");


class TerminalController{ //JSON형식의 응답은 필수적으로 거쳐야 함
    router=express.Router();
    constructor(){
        this.initializeRoutes();
    }
    initializeRoutes(){
        const router = express.Router();
        router.use(terminalResponse);
    }
    terminalResponse= (req,res)=>{
        //응답 로그 작성
        if(res.response){
            const {type,view,data,model,code,path}=res.response;
            if(type==="json"){
                return res.status(res.response.code).send(res.response); // {code: type: data:}
            }
            else if(type==="render"){
                return res.render(view,model);
            }
            else{
                return res.redirect(path);
            }
        }
        else{
            res.status(404).render("nonmatch");
        }
    }
}

module.exports.TerminalController = TerminalController;