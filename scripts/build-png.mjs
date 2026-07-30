import fs from 'fs'
import zlib from 'zlib'

const root = 'D:/.openclaw/workspace/projects/Mornsaelia-tavern'

// 复制前端 HTML 到 dist
const html = fs.readFileSync(root + '/src/莫恩瑟利亚/前端/index.html', 'utf-8')
fs.writeFileSync(root + '/dist/莫恩瑟利亚/前端/index.html', html)

// 艾瑟洛斯方式：alternate_greetings 代码块 + $('body').load(CDN)
const url = 'https://cdn.jsdelivr.net/gh/JellYsonnet/Mornsaelia-tavern@main/dist/' + encodeURIComponent('莫恩瑟利亚/前端/index.html')
const alt = '```\n<body>\n<script>\nvar t=new Date().getTime();\n$(\'body\').load(\'' + url + '?v=\'+t)\n</script>\n</body>\n```'

const firstMsg = ['## 【莫恩瑟利亚】', '___', '> 下拉招呼→加载前端面板。', '___', '**开始冒险→**'].join('\n')

const card = {
  name: '莫恩瑟利亚', spec: 'chara_card_v3', spec_version: '3.0',
  description: '开放世界RPG同层前端卡',
  personality: '', scenario: '',
  first_mes: firstMsg, mes_example: '', creatorcomment: '渊琳',
  avatar: 'none', talkativeness: '0.5', fav: false, tags: [],
  data: {
    name: '莫恩瑟利亚', description: '开放世界RPG同层前端卡',
    personality: '', scenario: '',
    first_mes: firstMsg, mes_example: '',
    creator_notes: '渊琳 - 艾瑟洛斯式',
    character_version: 'v9',
    system_prompt: '', post_history_instructions: '',
    tags: [], creator: '苏渊琳',
    alternate_greetings: [alt],
    extensions: {
      talkativeness: '0.5', fav: false, world: '莫恩瑟利亚',
      depth_prompt: { prompt: '', depth: 4, role: 'system' },
      tavern_helper: { scripts: [], variables: {} },
    },
    group_only_greetings: [],
    character_book: { entries: [], name: '莫恩瑟利亚' },
  },
}

const jsonStr = JSON.stringify(card)
console.log(`📦 JSON: ${(jsonStr.length / 1024).toFixed(1)} KB`)

// PNG
function crc32(b){let c=0xFFFFFFFF,t=new Int32Array(256);for(let i=0;i<256;i++){let cr=i;for(let j=0;j<8;j++)cr=(cr&1)?0xEDB88320^(cr>>>1):cr>>>1;t[i]=cr}for(let i=0;i<b.length;i++)c=t[(c^b[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function mc(t,d){let tb=Buffer.from(t,'ascii'),l=Buffer.alloc(4);l.writeUInt32BE(d.length);let cd=Buffer.concat([tb,d]);let c=Buffer.alloc(4);c.writeUInt32BE(crc32(cd));return Buffer.concat([l,tb,d,c])}
function mt(k,d){return mc('tEXt',Buffer.concat([Buffer.from(k+'\0','utf-8'),Buffer.from(d,'utf-8')]))}
const w=256,h=256,r=Buffer.alloc((w*4+1)*h);
for(let y=0;y<h;y++){let rs=y*(w*4+1);r[rs]=0;for(let x=0;x<w;x++){let p=rs+1+x*4,b=x<4||x>=w-4||y<4||y>=h-4,d=Math.sqrt((x-128)**2+(y-128)**2);if(b){r[p]=201;r[p+1]=168;r[p+2]=76;r[p+3]=255}else if(d<28){r[p]=201;r[p+1]=168;r[p+2]=76;r[p+3]=200}else{r[p]=13;r[p+1]=10;r[p+2]=8;r[p+3]=255}}}
const id=zlib.deflateSync(r),ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;
const sg=Buffer.from([137,80,78,71,13,10,26,10]);
let png=Buffer.concat([sg,mc('IHDR',ih),mc('IDAT',id),mc('IEND',Buffer.alloc(0))]);
const bc=Buffer.from(jsonStr,'utf-8').toString('base64');
function ins(p,c){let i=8;while(i<p.length-4){if(p.slice(i+4,i+8).toString()==='IEND')break;i+=12+p.readUInt32BE(i)}return Buffer.concat([p.slice(0,i),c,p.slice(i)])}
png=ins(png,mt('chara',bc));png=ins(png,mt('ccv3',bc));
fs.mkdirSync(root+'/dist/莫恩瑟利亚/角色卡',{recursive:true});fs.writeFileSync(root+'/dist/莫恩瑟利亚/角色卡/莫恩瑟利亚.png',png)
console.log(`✅ ${(png.length/1024).toFixed(1)} KB`)
