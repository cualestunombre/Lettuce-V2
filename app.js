const redis = require("redis");
const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const dotenv = require("dotenv");
const { sequelize } = require("./models");
dotenv.config();
const redisClient = redis.createClient({url:`redis://${process.env.REDIS_HOST}`,
password:process.env.REDIS_PASSWORD,    legacyMode: true,});
redisClient.connect();
const webSocket = require("./socket.js");
const passport = require("passport"); 
const passportConfig = require("./passport");
const { SessionSocketIdMap } = require("./models");

















module.exports.App=class App{
    server;
    constructor(contollers){
        this.app = express();
        dotenv.config();
        this.sessionMiddleware=session({
            resave: false,
            saveUninitialized: false,
            secret: process.env.COOKIE_SECRET,
            cookie: {
              httpOnly: true,
              secure: false,
              maxAge: 10000000000,
            },
            store: new RedisStore({client:redisClient})
          });
          passportConfig();
          this.connectDB();
          this.initializeMiddleWares();
          this.initializeControllers(contollers);
          this.initialzieErrorHandling();
          
    }
    connectDB(){
        sequelize
        .sync({ alter: true })
        .then(() => {
            console.log("데이터베이스 연결 성공");
        })
        .catch((err) => {
            console.error(err);
        }); // DB연결
    }
    initializeMiddleWares(){
        this.app.use(this.sessionMiddleware);
        this.app.use(passport.initialize()); //req에 passport 설정을 심는다
        this.app.use(passport.session());
        this.app.set("view engine", "ejs");
        this.app.use(morgan("dev")); // 패킷 정보 공개
        this.app.use("/static", express.static("static"));
        this.app.use("/uploads", express.static("uploads"));
        this.app.use(express.json()); //json파싱
        this.app.use(express.urlencoded({ extended: false })); //인코딩된 url파싱
        this.app.use(cookieParser(process.env.COOKIE_SECRET)); //쿠키에 암호 넣고 파싱함
    }
    initializeControllers(contollers){
        const router = express.Router();
        contollers.forEach((ele)=>{
            router.use(ele);
        });
        this.app.use(router);
    }
    initialzieErrorHandling(){
        this.app.use((req, res, next) => {
            res.render("nonmatch");
          });
        this.app.use((err, req, res, next) => {
            console.error(err);
            res.render("error", { error: err });
          });
    }
    listen(){
        const port = 8000;
        this.server = this.app.listen(port, async () => {
            console.log("Server Port : ", port);
            await SessionSocketIdMap.destroy({ where: {} });
            webSocket(this.getServer(), this.getApp(), this.getSessionMiddleware());
          });
    }
    getServer(){
        return this.server;
    }
    getApp(){
        return this.app;
    }
    getSessionMiddleware(){
        return this.sessionMiddleware;
    }
}