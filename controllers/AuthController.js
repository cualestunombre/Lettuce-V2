const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
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
    const router = Router();
    router
    .post("/signup", isNotLoggedIn,signUpType,this.signup) //회원 가입 처리 
    .post("/login",isNotLoggedIn,this.login) // 로그인 처리
    .post("/emailCheck",isNotLoggedIn,this.emailCheck) //이메일 확인
    .get("/login",isNotLoggedIn,this.getLogin) //로그인 페이지 렌더링
    .get("/join",isNotLoggedIn,this.getJoin) // 회원가입 페이지 렌더링
    .get("/naver",passport.authenticate('naver', { authType: 'reprompt' })) //네이버 로그인
    .get("/naver/callback",passport.authenticate("naver",{ //네이버 로그인 콜백 제공
      failureRedirect : "/"
      }),
      (req,res) => {res.redirect("/");})
    .get("/kakao",passport.authenticate("kakao")) //카카오 로그인
    .get("/kakao/callback",passport.authenticate("kakao", { //카카오 로그인 콜백제공
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
        res.response= {code:400, message:"기존에 있는 유저의 이메일을 입력하였습니다"};
        return next();
      }

      const hash = await bcrypt.hash(password, 12); //비밀번호 암호화 

      await User.create({
        email,
        nickName,
        password: hash,
        birthday,
      }); 

      res.response = {code:200, message:"회원가입에 성공하였습니다"};
      return next();

    } catch (error) {
      console.error(error);
      return next(error); 
    }
  }

  getLogin=(req, res) => {
    return res.render("login");
  }
  getJoin=(req, res) => {
    return res.render("join");
  }

  login=(req, res, next) => { //로그인 로직
    return passport.authenticate("local", (authError, user, info) => {
      if (authError) {
        res.response = { code: 500, message:"인증 과정 중 에러가 발생했습니다" };
        return next();
        
      }
      if (!user) {
        res.response = { code: 400, message:"로그인에 실패하였습니다"};
        return next();
      }

      req.login(user, (loginError) => {
        if (loginError) {
          res.response = {code:500, message:"로그인 과정 중 에러가 발생했습니다"}
        }
        else{
          res.response = {code:200,message:"로그인에 성공하였습니다"};
        }
        return next();
      });
    })(req, res, next);
  }
  
  emailCheck=(req, res,next) => {
    User.findAll({ raw:true,
      where: { email: req.body.email },
    }).then((result) => {
      if (result[0]) {
        res.response={code:400,message:"이미 해당 이메일을 가진 유저가 존재합니다"};
        
      } else {
        res.response={ code: 200,message:"해당 이메일은 사용가능합니다" };
      }
      next();
    });
  }
}










