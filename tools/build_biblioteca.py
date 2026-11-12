#!/usr/bin/env python3
"""Valida data/moleculas.txt y genera assets/biblioteca.json.
  python3 tools/build_biblioteca.py            -> valida y genera
  python3 tools/build_biblioteca.py --validate -> solo valida
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

CATS=['Esenciales','Fármacos','Neurotransmisores','Aminoácidos','Aromáticos','Inorgánicos','Hidrocarburos','Naturales','Vitaminas','Azúcares y lípidos','Nucleótidos','Polímeros','Desbloqueables']
R=pathlib.Path(__file__).resolve().parent.parent
def construir(solo_validar=False):
    usados=set();out=[];bad=[]
    for n,ln in enumerate((R/'data/moleculas.txt').read_text(encoding='utf8').splitlines(),1):
        if not ln.strip() or ln.startswith('#'):continue
        p=[x.strip() for x in ln.split('|')]
        if len(p)<4:bad.append(f'línea {n}: faltan campos');continue
        cat,name,smi,f=p[:4];cid=int(p[4]) if len(p)>4 and p[4].isdigit() else 0;reto=p[5] if len(p)>5 and p[5] else ''
        if cat not in CATS:bad.append(f'línea {n} ({name}): categoría desconocida «{cat}»');continue
        try:a,b=parse(smi);c=formula(a,b)
        except Exception as e:bad.append(f'línea {n} ({name}): SMILES inválido ({e})');continue
        if c!=pf(f):bad.append(f'línea {n} ({name}): la fórmula {f} no coincide con el SMILES (da {c})');continue
        s=slug(name)
        if s in usados:bad.append(f'línea {n} ({name}): nombre repetido');continue
        usados.add(s);d={'s':s,'n':name,'c':cat,'f':f,'i':cid,'a':a,'b':b}
        if reto:d['u']=reto
        out.append(d)
    for m in bad:print('ERROR',m)
    print(f'{len(out)} moléculas válidas, {len(bad)} con error')
    if bad:sys.exit(1)
    if solo_validar:return
    (R/'assets/biblioteca.json').write_text(json.dumps({'v':(R/'VERSION').read_text().strip(),'cats':CATS,'mols':out},ensure_ascii=False,separators=(',',':')),encoding='utf8')
    print('assets/biblioteca.json escrito con',len(out),'moléculas')
if __name__=='__main__':construir('--validate' in sys.argv)
