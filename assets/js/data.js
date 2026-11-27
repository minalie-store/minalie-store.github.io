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
  freeShipFrom: 449000,
  // Giá mua sớm áo dài Nhiên: đến hết 23:59 ngày 10/11/2026. Mở bán chính thức lúc 20:00 ngày 5/11/2026.
  earlyDeadline: "2026-11-10T23:59:59+07:00",
  launchAt: "2026-11-05T20:00:00+07:00",
  // Dán địa chỉ Web App của Google Apps Script vào đây (xem hướng dẫn nội bộ).
  // Để trống = chế độ thử: đơn KHÔNG được gửi đi.
  orderEndpoint: "https://script.google.com/macros/s/AKfycbygqKei8dHGt9Q5UYU2nd3ESDN5Q8OQwsLEt2sjp3AAFWFqVPe7YPNI_iwJKNq0I5FDaw/exec",
  // Địa chỉ cùng Web App (doGet) để đọc tồn kho từ sheet. Để trống = dùng tồn kho bên dưới.
  stockEndpoint: "https://script.google.com/macros/s/AKfycbygqKei8dHGt9Q5UYU2nd3ESDN5Q8OQwsLEt2sjp3AAFWFqVPe7YPNI_iwJKNq0I5FDaw/exec",
  // Số lượng tối đa website hiển thị/cho đặt mỗi size trong một lần (không lộ tồn kho thật).
  stockCap: 5,
  // Chương trình giảm giá toàn cửa hàng (Black Friday). Đặt active: false hoặc để hết hạn "end" là website tự về giá thường.
  sale: { active: true, name: "Black Friday", percent: 35, end: "2026-11-30T23:59:59+07:00", endLabel: "30/11" }
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
  "QUAN-AD-CHUN":  { S: 0, M: 2, L: 0, XL: 0 },
  "AO-LEN-KENGANG-TR": { S: 5, M: 5, L: 5, XL: 5 },
  "AO-LEN-KENGANG-DE": { S: 5, M: 5, L: 5, XL: 5 },
  "AO-LEN-POLO-TR": { Freesize: 5 },
  "AO-CANJI-TR": { Freesize: 5 },
  "AO-CANJI-DE": { Freesize: 5 }
};

window.COLLECTIONS = [
  { id: "elise-dress", name: "Elise Dress", blurb: "Váy tweed dáng suông, cổ sen và cúc bọc vải." },
  { id: "marine-set", name: "Marine Set", blurb: "Bộ áo và quần đũi tre mỏng, nhẹ, thoáng." },
  { id: "ao-dai-nhien", name: "Áo dài Nhiên", blurb: "Áo dài tơ nhăn form suông nhẹ, số lượng rất ít." },
  { id: "ao-len-ke-ngang", name: "Áo cộc len kẻ ngang", blurb: "Áo len dệt kim phong cách Paris Chic: kẻ ngang và polo cổ nâu." },
  { id: "canji-shirt", name: "Canji Shirt", blurb: "Áo khoác cardigan dệt kim mỏng, cài nút ngọc trai." }
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
    id: "canji-shirt",
    name: "Canji Shirt",
    collection: "canji-shirt",
    isNew: true,
    sizes: ["Freesize"],
    modes: [{ id: "main", label: "Áo", groups: ["ao"], price: 349000 }],
    colors: [
      { id: "trang", name: "Trắng", hex: "#f4f1ea", code: "AO-CANJI-TR", images: ["images/canji/canji-trang-muse3-1.jpg", "images/canji/canji-trang-muse3-2.jpg", "images/canji/canji-trang-muse3-3.jpg"] },
      { id: "den", name: "Đen", hex: "#1c1c1c", code: "AO-CANJI-DE", images: ["images/canji/canji-den-muse3-1.jpg", "images/canji/canji-den-muse3-2.jpg", "images/canji/canji-den-muse3-3.jpg"] }
    ],
    summary: "Áo khoác cardigan dệt kim mỏng, cổ tròn, cài hàng nút ngọc trai, ôm gọn cơ thể và thoáng khí.",
    highlights: [
      "Len dệt kim gân nhỏ, thoáng khí, co giãn và giữ ấm nhẹ.",
      "Cổ tròn, cài hàng nút ngọc trai phía trước.",
      "Tay dài, độ dài ngang eo, ôm gọn cơ thể.",
      "Khoác ngoài váy hai dây hoặc áo thun đều đẹp, mặc cài hoặc để hở.",
      "Freesize cho người dưới 60kg."
    ],
    sizeGuide: {
      type: "table",
      note: "Freesize, phù hợp người dưới 60kg. Nếu phân vân, vui lòng nhắn Zalo để được tư vấn.",
      tables: [
        { title: "Gợi ý chọn size", head: ["Size", "Cân nặng"], rows: [["Freesize", "Dưới 60kg"]] }
      ]
    }
  },
  {
    id: "ao-len-polo-co-nau",
    name: "Áo len dệt kim polo cổ nâu",
    collection: "ao-len-ke-ngang",
    isNew: true,
    sizes: ["Freesize"],
    modes: [{ id: "main", label: "Áo", groups: ["ao"], price: 449000 }],
    colors: [
      { id: "trang-co-nau", name: "Trắng cổ nâu", hex: "#f4efe6", code: "AO-LEN-POLO-TR", images: ["images/ao-polo/ao-len-polo-co-nau-muse1-1.jpg", "images/ao-polo/ao-len-polo-co-nau-muse1-2.jpg", "images/ao-polo/ao-len-polo-co-nau-muse1-3.jpg"] }
    ],
    summary: "Áo len dệt kim cộc tay cổ polo bẻ tự do, cổ và viền tay màu nâu trên nền trắng.",
    highlights: [
      "Len dệt kim ôm cơ thể, thoáng khí, mềm mại và co giãn tốt.",
      "Cổ bẻ tự do màu nâu, để lộ xương quai xanh, tạo cảm giác năng động, hiện đại.",
      "Cổ nâu tạo ranh giới tự nhiên giữa áo và tông da, giúp gương mặt nổi bật.",
      "Màu trắng cổ nâu sang trọng, thanh lịch, giúp sáng da.",
      "Freesize: phù hợp người dưới 170cm và dưới 55kg."
    ],
    sizeGuide: {
      type: "table",
      note: "Freesize, phù hợp người dưới 170cm và dưới 55kg. Độ co giãn 5 – 7cm; số đo lấy thủ công nên có thể chênh 2 – 3cm. Nếu phân vân, vui lòng nhắn Zalo để được tư vấn.",
      tables: [
        { title: "Gợi ý chọn size", head: ["Size", "Chiều cao", "Cân nặng"], rows: [["Freesize", "Dưới 170cm", "Dưới 55kg"]] }
      ]
    }
  },
  {
    id: "ao-coc-len-ke-ngang",
    name: "Áo cộc len kẻ ngang",
    collection: "ao-len-ke-ngang",
    isNew: true,
    sizes: ["S", "M", "L", "XL"],
    modes: [{ id: "main", label: "Áo", groups: ["ao"], price: 449000 }],
    colors: [
      { id: "trang", name: "Trắng", hex: "#f4f1ea", code: "AO-LEN-KENGANG-TR", images: ["images/ao-len/ao-len-ke-ngang-trang-muse1-1.jpg", "images/ao-len/ao-len-ke-ngang-trang-muse1-2.jpg", "images/ao-len/ao-len-ke-ngang-trang-muse1-3.jpg"] },
      { id: "den", name: "Đen", hex: "#1c1c1c", code: "AO-LEN-KENGANG-DE", images: ["images/ao-len/ao-len-ke-ngang-den-muse1-1.jpg", "images/ao-len/ao-len-ke-ngang-den-muse1-2.jpg", "images/ao-len/ao-len-ke-ngang-den-muse1-3.jpg"] }
    ],
    summary: "Áo len dệt kim cộc tay cổ tròn, họa tiết kẻ ngang phối viền, phong cách Paris Chic.",
    highlights: [
      "Len dệt kim mịn, co giãn tốt, giữ form, thoáng mát.",
      "Cổ tròn, tay ngắn, hàng khuy cài kim loại.",
      "Họa tiết kẻ ngang (Breton) phối viền tương phản.",
      "Dễ phối cùng quần short cạp cao, quần tây ống suông hoặc chân váy chữ A.",
      "Giặt tay hoặc dùng túi giặt, chế độ nhẹ; nên gấp gọn thay vì treo móc."
    ],
    sizeGuide: {
      type: "table",
      note: "Gợi ý theo cân nặng: S dưới 49kg, M 49 – 55kg, L 56 – 60kg. Thông số có thể chênh 1 – 2cm tùy cách đo. Nếu phân vân giữa 2 size, vui lòng nhắn Zalo để được tư vấn.",
      tables: [
        { title: "Số đo áo (cm)", head: ["Size", "Vai", "Dài áo", "Ngực", "Eo"], rows: [["S", 37, 60, 86, 68], ["M", 38, 62, 90, 72], ["L", 39, 63, 92, 76], ["XL", 40, 64, 94, 78]] }
      ]
    }
  },
  {
    id: "elise-dress",
    name: "Elise Dress",
    collection: "elise-dress",
    isNew: true,
    sizes: ["S", "M", "L", "XL"],
    modes: [{ id: "main", label: "Váy", groups: ["vay"], price: 649000 }],
    colors: [
      { id: "trang-kem", name: "Trắng kem", hex: "#efe6d8", code: "VAY-ELISE-TK", images: ["images/elise/elise-trang-kem-muse1-1.jpg", "images/elise/elise-trang-kem-muse1-2.jpg", "images/elise/elise-trang-kem-muse1-3.jpg"] },
      { id: "xanh-than", name: "Xanh than", hex: "#1f2a44", code: "VAY-ELISE-XT", images: ["images/elise/elise-xanh-than-muse1-1.jpg", "images/elise/elise-xanh-than-muse1-2.jpg", "images/elise/elise-xanh-than-muse1-3.jpg"] }
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
      { id: "set", label: "Cả bộ", groups: ["set"], price: 649000 },
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
