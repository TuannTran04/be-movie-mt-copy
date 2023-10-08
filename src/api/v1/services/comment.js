const Comment = require("../models/Comment");

class SocketServices {
  //connection socket
  connection(socket) {
    console.log(`User CONNECT id is ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`User disconnect id is ${socket.id}`);
    });

    // event on here

    socket.on("chat message", (msg) => {
      console.log(`msg is:::${msg}`);
      _io.emit("chat message", msg);
    });
    socket.on("new-comment", (data) => {
      console.log(`data is:::${data}`);
      socket.broadcast.emit("new-comment-user", data);
    });
    socket.on("new-reply-comment", (data) => {
      console.log(`data is:::${data}`);
      socket.broadcast.emit("new-reply-comment-user", data);
    });
    socket.on("comment-updated", (data) => {
      console.log(`data is:::${data}`);
      socket.broadcast.emit("comment-updated-user", data);
    });
    socket.on("reply-comment-updated", (data) => {
      console.log(`data is:::${data}`);
      socket.broadcast.emit("reply-comment-updated-user", data);
    });
    socket.on("comment-deleted", (data) => {
      console.log(`data is:::${data}`);
      socket.broadcast.emit("comment-deleted-user", data);
    });
    socket.on("reply-comment-deleted", (data) => {
      console.log(`data is:::${data}`);
      socket.broadcast.emit("reply-comment-deleted-user", data);
    });

    // on room...
  }
}
module.exports = new SocketServices();
