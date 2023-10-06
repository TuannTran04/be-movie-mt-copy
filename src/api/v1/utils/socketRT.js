// // socket.js
// const socketIO = require("socket.io");
// const server = require("..."); // Đảm bảo bạn đã import máy chủ Express

// const io = socketIO(server);

// module.exports = io;

// socketManager.js

let io; // Biến lưu trữ đối tượng socket.io

module.exports = {
  initializeSocket: (socketIO) => {
    io = socketIO; // Lưu trữ đối tượng socket.io

    io.on("connection", (socket) => {
      console.log("A user connected");

      socket.on("comment", (data) => {
        // Xử lý bình luận và gửi lại cho tất cả người dùng khác
        io.emit("newComment", data);
      });

      socket.on("disconnect", () => {
        console.log("A user disconnected");
      });

      //   socket.on("ping", (n) => {
      //     console.log("A user vc connected", n);
      //   });
    });
  },

  getSocketIO: () => {
    return io; // Hàm này sẽ cho phép bạn truy cập đối tượng socket.io từ các controller khác
  },
};
