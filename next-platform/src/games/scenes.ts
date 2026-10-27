import type { DemoGame } from "./types";
export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const text = (
  x: number,
  y: number,
  value: string,
  size = 28,
  color = "#26324b",
  weight = 600,
) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="Source Sans 3,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeHtml(value)}</text>`;
const tile = (
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  fill = "#ffffff",
  color = "#26324b",
  size = 28,
) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}"/>${text(x + w / 2, y + h / 2 + size * 0.35, label, size, color)}`;
const circle = (x: number, y: number, r: number, fill: string) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
function pie(
  cx: number,
  cy: number,
  r: number,
  count: number,
  selected: number,
) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2,
      b = ((i + 1) / count) * Math.PI * 2 - Math.PI / 2;
    return `<path d="M ${cx} ${cy} L ${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r} A ${r} ${r} 0 0 1 ${cx + Math.cos(b) * r} ${cy + Math.sin(b) * r} Z" fill="${i < selected ? "#f3ae56" : "#fff8eb"}" stroke="#7251be" stroke-width="3" stroke-linejoin="round"/>`;
  }).join("");
}
export function renderScene(game: DemoGame) {
  let scene = "";
  switch (game.scene) {
    case "fractions":
      scene = `${circle(266, 220, 154, "#ddd0f5")}${pie(266, 220, 132, 8, 3)}${tile(451, 144, 148, 124, "3 / 8", "#fff", "#6643bd", 38)}${text(523, 307, "eş parçayı keşfet", 18, "#6643bd", 400)}`;
      break;
    case "words":
      scene = `${tile(80, 98, 218, 72, "öykü")}${tile(80, 268, 218, 72, "hediye")}${tile(422, 98, 218, 72, "hikâye", "#f6bdba")}${tile(422, 268, 218, 72, "armağan", "#f6bdba")}<path d="M318 134H402 M318 304H402" stroke="#b95161" stroke-width="4" stroke-dasharray="8 8"/>${circle(360, 219, 26, "#b95161")}${text(360, 228, "=", 30, "#fff")}`;
      break;
    case "planets":
      scene = `<ellipse cx="358" cy="220" rx="281" ry="134" stroke="#66638f" fill="none"/><ellipse cx="358" cy="220" rx="195" ry="91" stroke="#66638f" fill="none"/><ellipse cx="358" cy="220" rx="104" ry="50" stroke="#66638f" fill="none"/>${circle(358, 220, 45, "#f8bb62")}${circle(262, 205, 17, "#c3bed4")}${circle(420, 153, 26, "#eb9777")}${circle(509, 274, 32, "#75c6d2")}${circle(163, 129, 23, "#c87272")}${circle(114, 302, 36, "#d1af8a")}${text(510, 337, "DÜNYA", 15, "#dfe9ff")}${text(360, 395, "Güneş Sistemi · Ölçekli değildir", 15, "#d5d4ed", 400)}`;
      break;
    case "compass":
      scene = `<circle cx="360" cy="220" r="132" fill="#fffaf0" stroke="#dbbe7e" stroke-width="2"/><circle cx="360" cy="220" r="100" fill="none" stroke="#e9d4a9" stroke-width="2"/><path d="M360 105L383 220L360 335L337 220Z" fill="#cf7158"/><path d="M360 220L360 335L337 220Z" fill="#e0c99f"/>${circle(360, 220, 13, "#fff")}${text(360, 66, "K", 25, "#805517")}${text(360, 394, "G", 25, "#805517")}${text(181, 228, "B", 25, "#805517")}${text(539, 228, "D", 25, "#805517")}`;
      break;
    case "multiply":
      scene = `${Array.from({ length: 12 }, (_, i) => circle(183 + (i % 4) * 51, 120 + Math.floor(i / 4) * 59, 17, "#9273d3")).join("")}${tile(425, 134, 160, 106, "3 × 4", "#fff", "#6643bd", 36)}${text(284, 341, "3 sıra · 4 nokta", 25, "#6643bd")}${text(505, 287, "= 12", 40, "#6643bd")}`;
      break;
    case "sentence":
      scene = `${tile(65, 115, 150, 70, "Bugün")}${tile(235, 115, 195, 70, "birlikte", "#f7c5af")}${tile(450, 115, 180, 70, "kitap")}${tile(245, 241, 230, 78, "okuduk.", "#ad564b", "#fff", 34)}<path d="M105 341H615" stroke="#d1917b" stroke-width="2"/>`;
      break;
    case "circuit":
      scene = `<path d="M170 305V145H310 M410 145H550V305H400 M320 305H170" fill="none" stroke="#3e9f8f" stroke-width="9" stroke-linecap="round"/><path d="M310 145L410 145" stroke="#326d66" stroke-width="7" stroke-linecap="round"/>${circle(310, 145, 8, "#326d66")}${circle(410, 145, 8, "#326d66")}<path d="M331 278V332M348 288V322M372 278V332M389 288V322" stroke="#326d66" stroke-width="6"/>${circle(550, 218, 42, "#ffda83")}${text(550, 229, "×", 45, "#9b6b18")}${text(360, 385, "Kapalı bir yol, yanan bir ışık", 22, "#126b68", 400)}`;
      break;
    case "recycle":
      scene = `${tile(75, 124, 170, 187, "KÂĞIT", "#81afdb", "#193f62", 22)}${tile(275, 124, 170, 187, "CAM", "#7dbba2", "#164d3c", 22)}${tile(475, 124, 170, 187, "PLASTİK", "#efce7d", "#64470d", 22)}<path d="M92 107H228M292 107H428M492 107H628" stroke="#2e674b" stroke-width="10" stroke-linecap="round"/>${text(360, 370, "Malzemeleri tanı. Doğru gruba ayır.", 23, "#357052", 400)}`;
      break;
    case "geometry":
      scene = `<path d="M100 290L183 125L266 290Z" fill="#a38ad9" stroke="#6046a2" stroke-width="3"/><rect x="296" y="143" width="143" height="143" rx="0" fill="#efbb6b" stroke="#b0843c" stroke-width="3"/><path d="M558 124L640 185L609 283H507L476 185Z" fill="#78bbae" stroke="#3d8879" stroke-width="3"/>${text(183, 353, "3 kenar", 23, "#51419a")}${text(367, 353, "4 kenar", 23, "#51419a")}${text(558, 353, "5 kenar", 23, "#51419a")}`;
      break;
    case "paragraph":
      scene = `<rect x="147" y="62" width="426" height="316" rx="12" fill="#fffaf5"/><rect x="189" y="134" width="277" height="23" rx="4" fill="#f6d4a2"/><path d="M189 145H462 M189 199H526 M189 247H499 M189 295H425" stroke="#c49e8c" stroke-width="7" stroke-linecap="round"/><circle cx="509" cy="282" r="50" fill="#fff5e9" fill-opacity=".7" stroke="#ab6451" stroke-width="9"/><path d="M545 318L587 360" stroke="#ab6451" stroke-width="15" stroke-linecap="round"/>`;
      break;
    case "chain":
      scene = `${tile(57, 163, 150, 94, "OT", "#b0c79e", "#264e31", 27)}${tile(285, 163, 150, 94, "ÇEKİRGE", "#fff", "#264e31", 22)}${tile(513, 163, 150, 94, "KURBAĞA", "#80b19b", "#1e493e", 21)}<path d="M224 210H266L253 198M266 210L253 222 M452 210H494L481 198M494 210L481 222" fill="none" stroke="#357052" stroke-width="4"/>${text(360, 330, "Enerjinin izini sür", 26, "#296b50", 400)}`;
      break;
    case "seasons":
      scene = `${tile(105, 66, 242, 139, "İLKBAHAR", "#bdd4a5", "#3e592c", 25)}${tile(371, 66, 242, 139, "YAZ", "#f3cd73", "#705020", 25)}${tile(105, 228, 242, 139, "SONBAHAR", "#e4aa7c", "#6b3f26", 25)}${tile(371, 228, 242, 139, "KIŞ", "#b1d1e1", "#305b6e", 25)}`;
      break;
    case "decimals":
      scene = `${tile(79, 112, 165, 203, "2,05", "#fff", "#6541a7", 38)}${tile(277, 89, 165, 226, "2,50", "#bea6dd", "#42276e", 38)}${tile(475, 133, 165, 182, "2,75", "#e8c38f", "#624313", 38)}${text(360, 372, "Küçükten büyüğe", 26, "#6541a7", 400)}`;
      break;
    case "punctuation":
      scene = `${tile(98, 100, 150, 221, "?", "#c8738b", "#fff", 135)}${tile(285, 134, 150, 187, ",", "#fff", "#a74557", 135)}${tile(472, 84, 150, 237, "!", "#efba92", "#7b4144", 135)}`;
      break;
    case "states":
      scene = `${tile(63, 106, 181, 225, "", "#c1e1ef")}${tile(269, 106, 181, 225, "", "#a5d0d9")}${tile(475, 106, 181, 225, "", "#d1e7e8")}${Array.from({ length: 9 }, (_, i) => circle(113 + (i % 3) * 39, 151 + Math.floor(i / 3) * 39, 11, "#386b83")).join("")}${[
        [314, 168],
        [345, 193],
        [395, 159],
        [313, 226],
        [369, 240],
        [411, 210],
      ]
        .map(([x, y]) => circle(x, y, 11, "#39798c"))
        .join("")}${[
        [517, 144],
        [605, 173],
        [541, 239],
        [623, 273],
      ]
        .map(([x, y]) => circle(x, y, 11, "#468d95"))
        .join(
          "",
        )}${text(153, 367, "KATI", 22, "#126b78")}${text(360, 367, "SIVI", 22, "#126b78")}${text(565, 367, "GAZ", 22, "#126b78")}`;
      break;
    case "crossing":
      scene = `<rect x="63" y="222" width="593" height="135" rx="12" fill="#717c8c"/>${Array.from({ length: 5 }, (_, i) => `<rect x="232" y="${235 + i * 24}" width="250" height="14" rx="2" fill="#fff8e9"/>`).join("")}<rect x="135" y="60" width="59" height="134" rx="18" fill="#354256"/>${circle(165, 96, 16, "#c96a68")}${circle(165, 156, 16, "#88bca1")}<path d="M165 194V235" stroke="#354256" stroke-width="9"/>${text(447, 133, "DUR · BAK · DİNLE", 28, "#82591b")}`;
      break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 440" role="img" aria-label="${escapeHtml(game.title)} etkinlik görseli"><rect width="720" height="440" fill="${game.background}"/>${scene}</svg>`;
}
