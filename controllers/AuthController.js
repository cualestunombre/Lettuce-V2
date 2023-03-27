const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { isLoggedIn, isNotLoggedIn } = require("../middlewares/authMiddlewares");
const {isJson,isRender} = require("../middlewares/typeMiddlewares");
const { User } = require("../models");
const { signUpType } = require("../type/signUpType");
module.exports.AuthController=AuthController;

class AuthController{ //인증 컨트롤러
  path="/auth";
  router = express.Router();
  constructor(){
    this.initializeRoutes();
  }

  initializeRoutes(){
    const router = express.Router();
    router
    .post("/signup", isJson,isNotLoggedIn,signUpType,this.signup) //회원 가입 처리 
    .post("/login",isJson,isNotLoggedIn,this.login) // 로그인 처리
    .post("/emailCheck",isJson,isNotLoggedIn,this.emailCheck) //이메일 확인
    .get("/login",isRender,isNotLoggedIn,this.getLogin) //로그인 페이지 렌더링
    .get("/join",isRender,isNotLoggedIn,this.getJoin) // 회원가입 페이지 렌더링
    .get("/naver",isJson,passport.authenticate('naver', { authType: 'reprompt' })) //네이버 로그인
    .get("/naver/callback",isJson,passport.authenticate("naver",{ //네이버 로그인 콜백 제공
      failureRedirect : "/"
      }),
      (req,res) => {res.redirect("/");})
    .get("/kakao",isJson,passport.authenticate("kakao")) //카카오 로그인
    .get("/kakao/callback",isJson,passport.authenticate("kakao", { //카카오 로그인 콜백제공
      failureRedirect: "/",
    }),
    (req, res) => { res.redirect("/");});
    this.router.use(this.path,router);
  }

  signup=async (req, res, next) => { //회원가입 로직
    const { email, nickName, password, birthday } = req.body;
    try {

      const exUser = await User.findOne({ where: { email } }); //기존에 해당 이메일을 가진 유저가 있는 지 확인
      if (exUser) {
        res.response = {...res.response,code:400, message:"기존에 있는 유저의 이메일을 입력하였습니다"};
        return next();
      }

      const hash = await bcrypt.hash(password, 12); //비밀번호 암호화 

      await User.create({
        email,
        nickName,
        password: hash,
        birthday,
      }); 

      res.response = {...res.response,code:200, message:"회원가입에 성공하였습니다"};
      return next();

    } catch (error) {
      return next(error); 
    }
  }

  getLogin=(req, res,next) => {
    res.response={...res.response,view:"/login"};
    next();
  }
  getJoin=(req, res,next) => {
    res.response={...res.response,view:"/join"};
    next();
  }

  login=(req, res, next) => { //로그인 로직
    try{
      return passport.authenticate("local", (authError, user, info) => {
        if (authError) {
      
          return next(new Error("인증 과정 중 에러가 발생했습니다"));
          
        }
        if (!user) {
          res.response = {...res.response, code: 400, message:"로그인에 실패하였습니다"};
          return next();
        }
  
        req.login(user, (loginError) => {
          if (loginError) {
            return next(new Error("로그인 과정 중 에러가 발생했습니다"))
          }
          else{
            res.response = {...res.response,code:200,message:"로그인에 성공하였습니다"};
          }
          return next();
        });
      })(req, res, next);
    }catch(err){
      
      next(error);
    }
    
  }
  
  emailCheck=(req, res,next) => { //이메일 중복 확인 로직
    
    User.findAll({ raw:true,
      where: { email: req.body.email },
    }).then((result) => {
      if (result[0]) {
        res.response={...res.response,code:400,message:"이미 해당 이메일을 가진 유저가 존재합니다"};
        
      } else {
        res.response={...res.response, code: 200,message:"해당 이메일은 사용가능합니다"};
      }
      next();
    }).catch(err=>{next(err);});
  }
}










