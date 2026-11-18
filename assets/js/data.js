/* Minalie: cấu hình và dữ liệu sản phẩm. Sửa ở đây khi đổi giá, tồn kho, thông tin liên hệ. */
window.CONFIG = {
  brand: "Minalie",
  slogan: "Elegance in Ease.",
  sloganVi: "Thanh lịch trong sự thoải mái.",
  hotline: "0395 795 964",
  hotlineHref: "tel:0395795964",
  zalo: "https://zalo.me/0395795964",
  email: "minali.store.info@gmail.com",
  fanpage: "https://www.facebook.com/minali.store.official",
  instagram: "https://www.instagram.com/minali.store.official/",
  shopee: "https://shopee.vn/minali.store",
  address: "Hà Đông, Hà Nội",
  bank: { name: "Techcombank", number: "0698 6986 94", holder: "Phạm Thị Nga" },
  shipFee: 25000,
  freeShipFrom: 999000,
  // Giá mua sớm áo dài Nhiên: đến hết 23:59 ngày 10/11/2026. Mở bán chính thức lúc 20:00 ngày 5/11/2026.
  earlyDeadline: "2026-11-10T23:59:59+07:00",
  launchAt: "2026-11-05T20:00:00+07:00",
  // Dán địa chỉ Web App của Google Apps Script vào đây (xem hướng dẫn nội bộ).
  // Để trống = chế độ thử: đơn KHÔNG được gửi đi.
  orderEndpoint: "https://script.google.com/macros/s/AKfycbygqKei8dHGt9Q5UYU2nd3ESDN5Q8OQwsLEt2sjp3AAFWFqVPe7YPNI_iwJKNq0I5FDaw/exec",
  // Địa chỉ cùng Web App (doGet) để đọc tồn kho từ sheet. Để trống = dùng tồn kho bên dưới.
  stockEndpoint: "https://script.google.com/macros/s/AKfycbygqKei8dHGt9Q5UYU2nd3ESDN5Q8OQwsLEt2sjp3AAFWFqVPe7YPNI_iwJKNq0I5FDaw/exec",
  // Số lượng tối đa website hiển thị/cho đặt mỗi size trong một lần (không lộ tồn kho thật).
  stockCap: 5
};

/* Tồn kho theo mã SP và size. Số công khai bị giới hạn ở stockCap (5) để không lộ lượng hàng thật; số thật nằm trong sheet "Minalie - Tồn kho". */
window.STOCK = {
  "VAY-ELISE-TK":  { S: 5, M: 5, L: 5, XL: 5 },
  "VAY-ELISE-XT":  { S: 5, M: 5, L: 5, XL: 5 },
  "SET-MARINE-XT": { S: 0, M: 5, L: 5, XL: 0 },
  "SET-MARINE-NC": { S: 1, M: 5, L: 5, XL: 0 },
  "AD-NHIEN-XR":   { S: 0, M: 2, L: 0, XL: 0 },
  "AD-NHIEN-HT":   { S: 0, M: 2, L: 1, XL: 0 },
  "QUAN-AD-KHOA":  { S: 0, M: 2, L: 1, XL: 0 },
  "QUAN-AD-CHUN":  { S: 0, M: 2, L: 0, XL: 0 }
};

window.COLLECTIONS = [
  { id: "elise-dress", name: "Elise Dress", blurb: "Váy tweed dáng suông, cổ sen và cúc bọc vải." },
  { id: "marine-set", name: "Marine Set", blurb: "Bộ áo và quần đũi tre mỏng, nhẹ, thoáng." },
  { id: "ao-dai-nhien", name: "Áo dài Nhiên", blurb: "Áo dài tơ nhăn form suông nhẹ, số lượng rất ít." }
];

window.GROUPS = {
  ao: "Áo",
  vay: "Váy",
  quan: "Quần",
  set: "Set"
};

/*
  Mỗi sản phẩm:
  - colors[].code: mã SP trong sheet tồn kho; images: ảnh theo màu (để trống = hiện khung chờ ảnh).
  - modes: cách mua (cả bộ, chỉ áo, chỉ quần...). price: số (giá thường) hoặc {early, late} (giá mua sớm / giá sau).
  - pairCode: mã SP của quần đi kèm khi mua bộ (theo màu).
*/
window.PRODUCTS = [
  {
    id: "elise-dress",
    name: "Elise Dress",
    collection: "elise-dress",
    isNew: true,
    sizes: ["S", "M", "L", "XL"],
    modes: [{ id: "main", label: "Váy", groups: ["vay"], price: 649000 }],
    colors: [
      { id: "trang-kem", name: "Trắng kem", hex: "#efe6d8", code: "VAY-ELISE-TK", images: ["images/elise/elise-trang-kem-1.jpg"] },
      { id: "xanh-than", name: "Xanh than", hex: "#1f2a44", code: "VAY-ELISE-XT", images: ["images/elise/elise-xanh-than-1.jpg"] }
    ],
    summary: "Váy tweed dáng suông chữ A, cổ sen tròn, 7 cúc bọc vải, túi ẩn hai bên hông.",
    highlights: [
      "Tweed không co giãn, không nhăn, giặt máy được.",
      "Dáng suông chữ A, không đường eo: ngồi lâu vẫn thoải mái.",
      "Cổ sen tròn và 7 cúc bọc vải chạy dọc thân.",
      "Túi ẩn hai bên hông, đủ để cất bút và điện thoại.",
      "Dài ngang đầu gối với chiều cao 1m55 – 1m58."
    ],
    sizeGuide: {
      type: "weight",
      note: "Form suông nhẹ, không ôm eo. Thông số có thể chênh 1 – 2cm tùy cách đo. Vải tweed không co giãn.",
      measureHead: ["Size", "Ngực", "Eo", "Vai", "Dài tay", "Dài váy"],
      measures: [["S", 90, 72, 39, 23, 90], ["M", 94, 76, 40, 24, 92], ["L", 98, 80, 41, 25, 94], ["XL", 102, 84, 42, 26, 96]],
      fitHead: ["Size", "Chiều cao (cm)", "Cân nặng (kg)"],
      fit: [["S", "150 – 157", "44 – 49"], ["M", "153 – 160", "49 – 54"], ["L", "155 – 163", "54 – 59"], ["XL", "158 – 165", "59 – 64"]],
      weightBreaks: [["S", 0, 49], ["M", 49, 54], ["L", 54, 59], ["XL", 59, 99]],
      weightRange: [44, 64],
      lengths: [["1m50", "qua gối khoảng 3cm"], ["1m55 – 1m58", "ngang gối"], ["1m60 – 1m65", "trên gối 3 – 5cm"], ["1m70", "trên gối khoảng 7cm"]]
    }
  },
  {
    id: "marine-set",
    name: "Marine Set",
    collection: "marine-set",
    isNew: false,
    sizes: ["S", "M", "L", "XL"],
    modes: [
      { id: "set", label: "Cả bộ", groups: ["set"], price: 659000 },
      { id: "ao", label: "Chỉ áo", groups: ["ao"], price: 499000, suffix: "áo" },
      { id: "quan", label: "Chỉ quần", groups: ["quan"], price: 449000, suffix: "quần" }
    ],
    colors: [
      { id: "xanh-than", name: "Xanh than", hex: "#1f2a44", code: "SET-MARINE-XT", images: ["images/marine/marine-xanh-than-2.jpg"] },
      { id: "ngu-coc", name: "Ngũ cốc", hex: "#d8c7a6", code: "SET-MARINE-NC", images: ["images/marine/marine-ngu-coc-1.jpg", "images/marine/marine-ngu-coc-2.jpg", "images/marine/marine-ngu-coc-3.jpg", "images/marine/marine-ngu-coc-4.jpg"] }
    ],
    summary: "Bộ áo cổ bẻ có đai thắt eo và quần cạp cao ống suông, may từ đũi tre mỏng.",
    highlights: [
      "Đũi tre mỏng: nhẹ, thoáng, ít nhăn.",
      "Áo cổ bẻ, có túi ngực và đai thắt eo.",
      "Quần cạp cao, ống suông, có ly giữa.",
      "Mua cả bộ, hoặc chỉ áo, hoặc chỉ quần."
    ],
    sizeGuide: {
      type: "table",
      note: "Thông số có thể chênh 1 – 2cm tùy phương pháp đo. Nếu số đo nằm giữa 2 size, nên chọn size lớn hơn để thoải mái hơn.",
      tables: [
        { title: "Áo (cm)", head: ["Size", "Ngực", "Dài áo", "Dài tay", "Rộng vai", "Rộng cửa tay"], rows: [["S", 95, 56, 20, "40,5", 31], ["M", 99, "57,5", "20,75", "41,5", 32], ["L", 103, 59, "21,5", "42,5", 33], ["XL", 107, "60,5", "22,25", "43,5", 34]] },
        { title: "Quần (cm)", head: ["Size", "Bụng/Eo", "Mông", "Dài quần", "Rộng ống"], rows: [["S", 68, 94, 102, 31], ["M", 72, 98, 102, 32], ["L", 76, 102, 103, 33], ["XL", 80, 106, 104, 34]] }
      ]
    }
  },
  {
    id: "ao-dai-nhien",
    name: "Áo dài Nhiên",
    collection: "ao-dai-nhien",
    isNew: true,
    preorder: true,
    sizes: ["M", "L"],
    modes: [
      { id: "ao", label: "Chỉ áo", groups: ["ao"], price: { early: 690000, late: 790000 } },
      { id: "bo", label: "Cả bộ (áo + quần)", groups: [], priceByColor: { "hong-tom": { early: 899000, late: 1099000 }, "xanh-reu": { early: 990000, late: 1190000 } } }
    ],
    colors: [
      { id: "xanh-reu", name: "Xanh rêu", hex: "#9aa43e", code: "AD-NHIEN-XR", pairCode: "QUAN-AD-CHUN", pairName: "quần lụa nâu cạp chun có túi", images: ["images/ao-dai/nhien-xanh-reu-1.jpg", "images/ao-dai/nhien-xanh-reu-2.jpg", "images/ao-dai/nhien-xanh-reu-3.jpg", "images/ao-dai/nhien-xanh-reu-chi-tiet.jpg"] },
      { id: "hong-tom", name: "Hồng tôm", hex: "#ee9f8a", code: "AD-NHIEN-HT", pairCode: "QUAN-AD-KHOA", pairName: "quần cạp khóa màu hồng", images: ["images/ao-dai/nhien-hong-tom-1.jpg", "images/ao-dai/nhien-hong-tom-2.jpg"] }
    ],
    summary: "Áo dài tơ nhăn form suông nhẹ, không chiết eo, cổ tròn thấp và tay dài hơi phồng.",
    highlights: [
      "Tơ nhăn không giãn, form suông nhẹ, không chiết eo.",
      "Cổ tròn thấp, hàng cúc vàng nhỏ trên vai.",
      "Tay dài hơi phồng, cổ tay cài cúc.",
      "Bộ xanh rêu đi cùng quần lụa nâu cạp chun có túi; bộ hồng tôm đi cùng quần cạp khóa màu hồng.",
      "May số lượng rất ít."
    ],
    sizeGuide: {
      type: "weight",
      note: "Form suông, chọn size theo chiều cao và cân nặng. Vải tơ nhăn không giãn. Hiện chỉ còn size M và L.",
      measureHead: ["Size", "Ngực", "Eo", "Mông"],
      measures: [["S", 84, 68, 88], ["M", 88, 72, 92], ["L", 92, 76, 96]],
      fitHead: ["Size", "Chiều cao", "Cân nặng"],
      fit: [["S", "1m50 – 1m58", "42 – 47kg"], ["M", "1m53 – 1m62", "47 – 52kg"], ["L", "1m55 – 1m65", "52 – 57kg"]],
      weightBreaks: [["S", 0, 47], ["M", 47, 52], ["L", 52, 99]],
      weightRange: [42, 57],
      lengths: [["1m50", "chạm mắt cá chân"], ["1m55 – 1m58", "gần chạm mắt cá"], ["1m60 – 1m65", "trên mắt cá 5 – 8cm"]]
    }
  },
  {
    id: "quan-ao-dai-cap-khoa",
    name: "Quần áo dài cạp khóa",
    collection: "ao-dai-nhien",
    isNew: true,
    preorder: true,
    sizes: ["M", "L"],
    modes: [{ id: "main", label: "Quần", groups: ["quan"], price: { early: 290000, late: 390000 } }],
    colors: [{ id: "hong", name: "Hồng", hex: "#f3d6d9", code: "QUAN-AD-KHOA", images: ["images/ao-dai/quan-cap-khoa-hong-1.jpg"] }],
    summary: "Quần cạp khóa màu hồng, đi cùng áo dài Nhiên hồng tôm.",
    highlights: ["Quần cạp khóa màu hồng.", "Đi cùng áo dài Nhiên màu hồng tôm.", "May số lượng rất ít."],
    sizeGuide: { type: "note", note: "Chưa có bảng số đo chi tiết của quần. Vui lòng nhắn Zalo để được tư vấn size." }
  },
  {
    id: "quan-ao-dai-cap-chun",
    name: "Quần áo dài cạp chun có túi",
    collection: "ao-dai-nhien",
    isNew: true,
    preorder: true,
    sizes: ["M", "L"],
    modes: [{ id: "main", label: "Quần", groups: ["quan"], price: { early: 390000, late: 490000 } }],
    colors: [{ id: "nau-lua", name: "Nâu (lụa)", hex: "#5b3626", code: "QUAN-AD-CHUN", images: ["images/ao-dai/quan-cap-chun-nau-1.jpg"] }],
    summary: "Quần lụa nâu cạp chun có túi, đi cùng áo dài Nhiên xanh rêu.",
    highlights: ["Lụa màu nâu, cạp chun, có túi.", "Đi cùng áo dài Nhiên màu xanh rêu.", "May số lượng rất ít."],
    sizeGuide: { type: "note", note: "Chưa có bảng số đo chi tiết của quần. Vui lòng nhắn Zalo để được tư vấn size." }
  }
];
