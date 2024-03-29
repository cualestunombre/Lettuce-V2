const express = require("express");
const {Controller} = require("./Controller");

class TerminalController extends Controller{ //JSON형식의 응답은 필수적으로 거쳐야 함
    
    initializeRoutes(){
        const router = express.Router();
        router.use(terminalResponse);
    }
    terminalResponse= (req,res)=>{
        //응답 로그 작성
        if(res.response){
            // json type 응답 형식 {type, data, code, }
            const {type,view,data,model,code,path}=res.response;
            if(type==="json"){
                return res.status(res.response.code).send(res.response); 
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