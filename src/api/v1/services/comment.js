const jwt = require("jsonwebtoken");

// const connectedUsers = {}; // Để lưu thông tin kết nối socket của người dùng
const connectedUsers = new Map();
// console.log(">>> connectedUsers <<<", connectedUsers);
let userId = "";

class SocketServices {
  //connection socket
  connection(socket) {
    console.log(`User CONNECT id is ${socket.id}`);
    // console.log(`User CONNECT id is ${socket}`);

    // Lấy token từ header của handshake
    // const token = socket.handshake.query.token;
    const token = socket.handshake.headers.authorization;
    // console.log("token", token);
    // if (!token) {
    //   console.log("disconnect socket");
    //   // Xử lý trường hợp không có token
    //   socket.disconnect(); // Ngắt kết nối
    //   return;
    // }

    if (token) {
      // Xác thực token ở đây và xác định userId
      // Ví dụ, sử dụng thư viện JWT
      try {
        const accessToken = token.split(" ")[1];
        const decodedToken = jwt.verify(
          accessToken,
          process.env.JWT_ACCESS_KEY
        );
        userId = decodedToken.id;
        // console.log(userId);
        console.log(decodedToken);

        if (userId) {
          // Lưu thông tin kết nối socket của người dùng
          // connectedUsers[userId] = socket;
          connectedUsers.set(userId, socket);
        }

        console.log(
          ">>> connectedUsers socket <<<",
          // Object.keys(connectedUsers).length
          connectedUsers.size
        );
        // console.log(">>> connectedUsers socket <<<", connectedUsers);
        // console.log(">>> connectedUsers socket <<<", connectedUsers[userId]);
      } catch (error) {
        // Xử lý lỗi xác thực token
        console.error("Lỗi xác thực token:", error);
        socket.disconnect(); // Ngắt kết nối
        return;
      }
    }

    socket.on("disconnect", () => {
      console.log(`User disconnect id is ${socket.id}`);

      console.log("disconnect", userId);
      if (false) {
        // Thực hiện các xử lý sau khi người dùng bị ngắt kết nối
        // Ví dụ: xóa người dùng khỏi danh sách connectedUsers
        // delete connectedUsers[userId];
        connectedUsers.delete(userId);
      }
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

    socket.on("new-notify-comment", (data, recipientId) => {
      console.log(`data new-notify-comment is:::${data}`);
      console.log(`data recipientId is:::${recipientId}`);
      // socket.to(recipientId).emit("new-notify-comment-user", data);
      // Kiểm tra xem người dùng có kết nối socket không

      const recipientSocket = connectedUsers.get(recipientId);
      if (recipientSocket) {
        console.log(">>> recipientId socket <<<", recipientSocket);

        // Gửi thông báo đến socket của người dùng được trả lời
        recipientSocket.emit("new-notify-comment-user", data);
      }
    });

    // on room...
  }
}
module.exports = new SocketServices();
