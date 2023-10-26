const Redis = require("ioredis");

const redis = new Redis();

// Kiểm tra kết nối
redis.ping((err, result) => {
  if (err) {
    console.error("Lỗi kết nối Redis:", err);
    redis.disconnect();
  } else {
    console.log("Kết nối Redis thành công");
  }
});

// Xử lý sự kiện lỗi kết nối
redis.on("error", (err) => {
  console.error("Lỗi kết nối Redis:", err);
  redis.disconnect();
});

module.exports = redis;
