const {App} = require("./newApp.js");
const express = require("express");
const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const userRouter = require("./routes/user");
const postRouter = require("./routes/posting");
const testRouter = require("./routes/test");
const likeRouter = require("./routes/like");
const exploreRouter = require("./routes/explore");
const commentRouter = require("./routes/comment");
const realtimeRouter = require("./routes/realtime");
const chatRouter = require("./routes/chat");
const recommendRouter = require("./routes/recommend");



async function startServer(){
    const index = express.Router();
    index.use("/",indexRouter);
    const auth = express.Router();
    auth.use("/auth",authRouter);
    const profile = express.Router();
    profile.use("/profile",profile);
    const user = express.Router();
    user.use("/user",userRouter);
    const explore = express.Router();
    explore.use("/explore",exploreRouter);
    const like = express.Router();
    like.use(likeRouter);
    const comment = express.Router();
    comment.use("/comment",commentRouter);
    const realtime = express.Router();
    realtime.use("/realtime",realtimeRouter);
    const chat = express.Router();
    chat.use("/chat",chatRouter);
    const recommend = express.Router();
    recommend.use("/recommend",recommendRouter);

    const app = new App([
        index,
        auth,
        profile,
        user,
        explore,
        like,
        comment,
        realtime,
        chat,
        recommend,

    ]);
    
    app.listen();
}
startServer();
