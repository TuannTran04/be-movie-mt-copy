const { model, Types, Schema } = require("mongoose"); // Erase if already required

const DOCUMENT_NAME = "CommentV2";
const COLLECTION_NAME = "CommentV2s";

const commentSchemaV2 = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    movieId: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
    },
    // repliesCount: {
    //   type: Number,
    //   default: 0,
    // },
    content: { type: String, required: true },
    path: { type: String, default: "", index: true }, // Chuỗi đường dẫn đến nút cha, mặc định là rỗng
    commentLevel: { type: Number, default: 1 },
    childCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: COLLECTION_NAME }
);

// commentSchemaV2.statics.updateChildCount = async function (parentCommentId) {
//   try {
//     // Đếm số lượng comment con của comment cha
//     const childCount = await this.countDocuments({ path: parentCommentId });

//     // Cập nhật số lượng comment con vào bản ghi của comment cha
//     // await this.findOneAndUpdate(
//     //   { _id: parentCommentId },
//     //   { childCount: childCount }
//     // );
//     console.log(
//       `Updated child count for comment ${parentCommentId}: ${childCount}`
//     );
//     return childCount;
//   } catch (error) {
//     console.error("Error updating child count:", error);
//   }
// };

module.exports = model(DOCUMENT_NAME, commentSchemaV2);
