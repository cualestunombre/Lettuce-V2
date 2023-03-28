module.exports.timeConverter = (ele) => {
    if (now - ele.createdAt.getTime() > 3600 * 1000) {
      ele.time = `${parseInt(parseInt((now - ele.createdAt.getTime()) / 1000) / 3600)}시간전`;
    } else if (now - ele.createdAt.getTime() <= 60 * 1000) {
      ele.time = `${parseInt((now - ele.createdAt.getTime()) / 1000)}초전`;
    } else {
      ele.time = `${parseInt(parseInt((now - ele.createdAt.getTime()) / 1000) / 60)}분전`;
    }
  }