#!/usr/bin/env python3
"""Reconstruye la biblioteca de moléculas a partir de data/moleculas.txt.
  python3 tools/build_biblioteca.py             -> valida y regenera assets/fixtures-*.js
  python3 tools/build_biblioteca.py --validate  -> solo valida
"""
import re,json,unicodedata,sys,os,pathlib
E={ # símbolo: (nombre, masa, covalente, vdw, valencia, color)
'H':1,'C':4,'N':3,'O':2,'F':1,'P':3,'S':2,'Cl':1,'Br':1,'I':1}
NEW=[("B","Boro",10.81,.84,1.92,3,"#f2a6a6"),("Si","Silicio",28.085,1.11,2.1,4,"#c9a27e"),("Se","Selenio",78.971,1.2,1.9,2,"#ffa100"),
("As","Arsénico",74.922,1.19,1.85,3,"#bd80e3"),("Li","Litio",6.94,1.28,1.82,1,"#cc80ff"),("Na","Sodio",22.99,1.66,2.27,1,"#ab5cf2"),
("K","Potasio",39.098,2.03,2.75,1,"#8f40d4"),("Mg","Magnesio",24.305,1.41,1.73,2,"#8aff00"),("Ca","Calcio",40.078,1.76,2.31,2,"#3dff00"),
("Al","Aluminio",26.982,1.21,1.84,3,"#bfa6a6"),("Zn","Zinc",65.38,1.22,1.39,2,"#7d80b0"),("Fe","Hierro",55.845,1.32,2.04,2,"#e06633"),
("Cu","Cobre",63.546,1.32,1.4,2,"#c88033"),("He","Helio",4.0026,.28,1.4,0,"#d9ffff"),("Ne","Neón",20.18,.58,1.54,0,"#b3e3f5"),
("Ar","Argón",39.948,1.06,1.88,0,"#80d1e3"),("Kr","Kriptón",83.798,1.16,2.02,0,"#5cb8d1"),("Xe","Xenón",131.293,1.4,2.16,0,"#429eb0")]
for s,*_,v,c in NEW: E[s]=v
def parse(smi):
    atoms=[];bonds=[];stack=[];ring={};prev=None;order=1;i=0
    while i<len(smi):
        ch=smi[i]
        if ch=='(':stack.append(prev);i+=1;continue
        if ch==')':prev=stack.pop();i+=1;continue
        if ch in '-=#':order={'-':1,'=':2,'#':3}[ch];i+=1;continue
        if ch.isdigit():
            n=int(ch)
            if n in ring:
                a,o=ring.pop(n);bonds.append([a,prev,max(o,order) if (o>1 or order>1) else 1]);order=1
            else: ring[n]=(prev,order);order=1
            i+=1;continue
        if ch=='[':
            j=smi.index(']',i);el=smi[i+1:j];i=j+1
        else:
            el=smi[i:i+2] if smi[i:i+2] in('Cl','Br') else ch;i+=len(el)
        atoms.append(el);idx=len(atoms)-1
        if prev is not None:bonds.append([prev,idx,order])
        prev=idx;order=1
    assert not ring,('anillo abierto',smi)
    return atoms,bonds
def formula(atoms,bonds):
    cnt={}
    for k,a in enumerate(atoms):
        cnt[a]=cnt.get(a,0)+1
        if a!='H':
            s=sum(b[2] for b in bonds if k in b[:2]); h=max(0,E[a]-s)
            if h: cnt['H']=cnt.get('H',0)+h
    return cnt
def pf(f):
    d={}
    for el,n in re.findall(r'([A-Z][a-z]?)(\d*)',f): d[el]=d.get(el,0)+int(n or 1)
    return d
def slug(n):
    n=unicodedata.normalize('NFD',n.lower());n=''.join(c for c in n if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+','-',n).strip('-')
SUM={'Inorgánicos':'Compuesto inorgánico','Hidrocarburos':'Hidrocarburo','Aromáticos':'Compuesto aromático o heterocíclico','Esenciales':'Compuesto orgánico fundamental','Aminoácidos':'Aminoácido proteinogénico','Neurotransmisores':'Neurotransmisor u hormona','Fármacos':'Principio activo de uso farmacéutico','Naturales':'Producto natural','Vitaminas':'Vitamina','Azúcares y lípidos':'Azúcar o lípido','Nucleótidos':'Base o nucleósido','Polímeros':'Monómero o precursor de polímeros'}
BASE=('Esenciales','Fármacos','Neurotransmisores','Aminoácidos','Aromáticos')
R=pathlib.Path(__file__).resolve().parent.parent
def construir(validar_solo=False):
    used={'cafeina','aspirina','paracetamol','ibuprofeno','serotonina','dopamina','glicina','alanina','benceno','tolueno','etanol','agua','metano','acido-acetico'}
    out=[];bad=[];cats=[]
    for n,ln in enumerate((R/'data/moleculas.txt').read_text(encoding='utf8').splitlines(),1):
        if not ln.strip() or ln.startswith('#'):continue
        p=ln.split('|')
        if len(p)<4:bad.append(f'línea {n}: faltan campos');continue
        cat,name,smi,f=[x.strip() for x in p[:4]];cid=p[4].strip() if len(p)>4 and p[4].strip() else None
        if cat not in SUM:bad.append(f'línea {n} ({name}): categoría desconocida «{cat}»');continue
        try:
            a,b=parse(smi);c=formula(a,b)
        except Exception as e:
            bad.append(f'línea {n} ({name}): SMILES inválido ({e})');continue
        if c!=pf(f):bad.append(f'línea {n} ({name}): la fórmula {f} no coincide con el SMILES (da {c})');continue
        s=slug(name)
        if s in used:bad.append(f'línea {n} ({name}): nombre repetido');continue
        used.add(s)
        if cat not in cats:cats.append(cat)
        els=','.join('`%s`'%x for x in a);bs=','.join('[%d,%d%s]'%(x[0],x[1],'' if x[2]==1 else ','+str(x[2])) for x in b)
        out.append('{slug:`%s`,name:`%s`,iupac:`%s`,category:`%s`,%ssummary:`%s: %s.`,build:()=>O([%s],[%s])}'%(s,name,name.lower(),cat,'pubchemCid:%s,'%cid if cid and cid.isdigit() else '',SUM[cat],f,els,bs))
    for m in bad:print('ERROR',m)
    print(f'{len(out)} moléculas válidas, {len(bad)} con error')
    if bad:sys.exit(1)
    if validar_solo:return
    s=(R/'data/fixtures-original.js').read_text(encoding='utf8')
    ver=(R/'VERSION').read_text().strip()
    els=','.join("%s:{symbol:`%s`,name:`%s`,mass:%s,covalent:%s,vdw:%s,valence:%s,color:`%s`}"%x[:1]+x[:1]+x[1:] if False else "%s:{symbol:`%s`,name:`%s`,mass:%s,covalent:%s,vdw:%s,valence:%s,color:`%s`}"%(x[0],x[0],x[1],x[2],x[3],x[4],x[5],x[6]) for x in NEW)
    def rep(s,a,b):
        assert s.count(a)==1,a;return s.replace(a,b)
    s=rep(s,"color:`#9b4fd1`}},te=[","color:`#9b4fd1`},"+els+"},te=[")
    s=rep(s,"`I`,`H`]","`I`,`H`,"+','.join('`%s`'%x[0] for x in NEW)+"]")
    s=rep(s,"}],Cn=[`Esenciales`","},"+",".join(out)+"],Cn=[`Esenciales`")
    s=rep(s,"`Aromáticos`]","`Aromáticos`,"+','.join('`%s`'%c for c in cats if c not in BASE)+"]")
    s=rep(s,"url:e=>`https://pubchem.ncbi.nlm.nih.gov/compound/${e.pubchemCid}`","url:e=>e.pubchemCid?`https://pubchem.ncbi.nlm.nih.gov/compound/${e.pubchemCid}`:`https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(e.name)}`")
    s=rep(s,"v0.1","v"+ver)
    s=re.sub(r"href:`/(?!/|Molforge-pro)([^`]*)`",r"href:`/Molforge-pro/\1`",s)   # enlaces fijos del menú
    (R/'assets/fixtures-D22f8Dkt.js').write_text(s,encoding='utf8')
    total=14+len(out)
    for f in ('index.html','404.html'):
        h=(R/f).read_text(encoding='utf8')
        h=re.sub(r'(Elige entre (?:<!-- -->)?)\d+((?:<!-- -->)? compuestos)',r'\g<1>%d\2'%total,h)
        h=re.sub(r'MIT · v[\w. ]+?(?=<)', 'MIT · v'+ver, h)
        (R/f).write_text(h,encoding='utf8')
    print('Biblioteca reconstruida:',total,'moléculas · versión',ver)
if __name__=='__main__':
    construir('--validate' in sys.argv)
