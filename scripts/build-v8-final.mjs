// 基于 v8 工作方案，只改窗口比例 + 更新前端 HTML
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// 读取前端 HTML（最新版，含完整欢迎叙事）
const html = fs.readFileSync(root + '/src/莫恩瑟利亚/前端/index.html', 'utf-8')
    .replace(/\r\n/g, '\n')

// base64 编码（v8 方式）
const b64 = Buffer.from(encodeURIComponent(html)).toString('base64')

// alternate_greeting：window.open 新标签页，宽高调好
const s = '```\n<body>\n<script>\nvar h=decodeURIComponent(atob("' + b64 + '"));\nvar b=new Blob([h],{type:"text/html"});\nvar u=URL.createObjectURL(b);\nwindow.open(u,"莫恩瑟利亚","width=1200,height=800");\n</script>\n</body>\n```'

const fm = '## 【莫恩瑟利亚】\n___\n> 下拉招呼→新标签页打开前端。\n___\n**开始冒险→**'

const card = {
    name:"莫恩瑟利亚", description:"开放世界RPG", personality:"GM",
    scenario:"从起始之村开始", first_mes:fm, mes_example:"", creatorcomment:"渊琳",
    avatar:"none", talkativeness:"0.5", fav:false,
    tags:["RPG","开放世界","同层前端","莫恩瑟利亚"],
    spec:"chara_card_v3", spec_version:"3.0",
    data:{
        name:"莫恩瑟利亚", description:"开放世界RPG", personality:"GM",
        scenario:"从起始之村开始", first_mes:fm, mes_example:"",
        creator_notes:"渊琳 v8-final", character_version:"v8-final",
        system_prompt:"GM。描述场景、扮演NPC、D20检定。每次回复<status><exits><options>。",
        post_history_instructions:"每次回复<thinking><content><status><exits><options>。",
        tags:["RPG","开放世界","同层前端","莫恩瑟利亚"], creator:"苏渊琳",
        alternate_greetings:[s],
        extensions:{talkativeness:"0.5",fav:false,world:"莫恩瑟利亚",depth_prompt:{prompt:"",depth:4,role:"system"},tavern_helper:[["scripts",[]],["variables",{}]]},
        group_only_greetings:[],
        character_book:{entries:[{id:0,keys:[],constant:true,insertion_order:1,enabled:true,position:"before_char",use_regex:true,extensions:{position:0,depth:4,probability:100,useProbability:true},content:"回复<thinking><content><status><exits><options>"}],name:"莫恩瑟利亚"}
    }
}

const jsonStr = JSON.stringify(card)

// PNG 生成（和 v8 完全一样的方式）
function crc32(b){let c=0xFFFFFFFF,t=new Int32Array(256);for(let i=0;i<256;i++){let cr=i;for(let j=0;j<8;j++)cr=(cr&1)?0xEDB88320^(cr>>>1):cr>>>1;t[i]=cr}for(let i=0;i<b.length;i++)c=t[(c^b[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function mc(t,d){let tb=Buffer.from(t,'ascii'),l=Buffer.alloc(4);l.writeUInt32BE(d.length);let cd=Buffer.concat([tb,d]);let c=Buffer.alloc(4);c.writeUInt32BE(crc32(cd));return Buffer.concat([l,tb,d,c])}
function mt(k,d){return mc('tEXt',Buffer.concat([Buffer.from(k+'\0','utf-8'),Buffer.from(d,'utf-8')]))}
const w=256,h=256,r=Buffer.alloc((w*4+1)*h);
for(let y=0;y<h;y++){let rs=y*(w*4+1);r[rs]=0;for(let x=0;x<w;x++){let p=rs+1+x*4,b=x<4||x>=w-4||y<4||y>=h-4,dx=x-128,dy=y-128,d=Math.sqrt(dx*dx+dy*dy);if(b){r[p]=201;r[p+1]=168;r[p+2]=76;r[p+3]=255}else if(d<28){r[p]=201;r[p+1]=168;r[p+2]=76;r[p+3]=200}else{r[p]=13;r[p+1]=10;r[p+2]=8;r[p+3]=255}}}
const id=zlib.deflateSync(r),ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;
const sg=Buffer.from([137,80,78,71,13,10,26,10]);
let png=Buffer.concat([sg,mc('IHDR',ih),mc('IDAT',id),mc('IEND',Buffer.alloc(0))]);
const bc=Buffer.from(JSON.stringify(card),'utf-8').toString('base64');
function ins(p,c){let i=8;while(i<p.length-4){if(p.slice(i+4,i+8).toString()==='IEND')break;i+=12+p.readUInt32BE(i)}return Buffer.concat([p.slice(0,i),c,p.slice(i)])}
png=ins(png,mt('chara',bc));png=ins(png,mt('ccv3',bc));

const outDir = root + '/dist/莫恩瑟利亚/角色卡'
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(outDir + '/莫恩瑟利亚.png', png)
console.log('✅ v8-final!', (png.length / 1024).toFixed(1), 'KB')
console.log('方式: window.open() → 1200×800 新标签页')
