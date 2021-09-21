/**************************************************
	Static Range Coder order2 2021.9.20
***************************************************
simple version.
usage:
	o2e(A,cb,bs,up,done,rate)
	@A  :data for compression
	@cb :counter bits(0-7)+8
	@bs :block size. bs==0:1<<24, bs<16:1<<bs+9, bs<1024:bs<<10, or row value
	@up :if true then update static model
	@done: call back for finished
	@rate: -
	@return: call @done. if @done isn't function, return compressd @A

	o2d(A,done,rate)
	@A  :data for decompression
	@done: call back for finished
	@rate: -
	@return: call @done. if @done isn't function, return decompressd @A
***************************************************/
// compress
function o2e(A,cb,bs,up,done,rate){
	function pbits(i,s,c){
		for(;i;)for(L+=(R>>>=1)*(s>>>--i&1);R<16777216;L=L<<8>>>0,R*=256)
			if(255>L>>>24)
				for(c=L/0x100000000,O[o++]=255&c+B,B=L>>>24,c+=255;N;N--)O[o++]=255&c;
			else++N
	}
	function cbt(n,m,l){
		m=(1<<l)-m;
		n<m?--l:n+=m;pbits(l,n)
	}
	function newModel(C,D,F,P,S){
		// check previous model, collect symbols(+counter)
		for(var b=0,c,d=0,e=0,f=0,l,x,as=0,I=[];b<256;P[b++]=!c)
			c=F[b],d<c&&(d=c),P[b]-!c||e++,c?C[as]=F[S[as++]=x=b]-1:D[f++]=b;
		F[b]=as;
		// write symbol table
		if(as<2){
			pbits(2,0);
			if(d<5)cbt(d-1,cb+4,5);
			else l=l2b(d-=4)-1,cbt(l+4,cb+4,5),pbits(l,d);
			pbits(8,S[0])
		}else{
			l=l2b(--d);
			if(b==e)pbits(6,l+16),pbits(4,0); // current is the same as previous
			else{
				c=toDelta(S,as)+4,d=f?toDelta(D,f)+4:4,e=gammaRLE(F,b); // costs
				if(c<d&&c<e&&as<21)
					pbits(6,l+16),cbt(as-1,20,5),toDelta(S,as,pbits); // save 2-20sym
				else if(d<c&&d<e&&f<20)
					pbits(6,l+32),cbt(f,20,5),f&&toDelta(D,f,pbits); // exclude 0-19sym
				else pbits(6,l+48),gammaRLE(F,b,0,pbits) // encode bit flags by RLE(it will be <258bits)
			}
			D[c=0]=l*as;
			if(l>2)D[c=1]=vl2cost(C,as,l);
			if(l>3)D[c=2]=vl3cost(C,as,l);
			if(l>4)D[c=3]=vl4cost(C,as,l);
			if(l>6)D[c=4]=vlNcost(C,as,l);
			// select best score
			if(b=c){
				for(;I[b]=b--;);
				b=I.sort(function(a,b){return D[a]-D[b]})[0];
				if(c<2)pbits(1,b);
				else if(c<3)pbits(1,b>0),b&&pbits(1,b>1);
				else l<7?pbits(2,b):cbt(b,5,3);c=0
			}
			// write probability
			if(!b)for(;c<as;)pbits(l,C[c++]);
			else b<2?vl2enc(C,as,l,O):b<3?vl3enc(C,as,l,O):b<4?vl4enc(C,as,l,O):vlNenc(C,as,l,O)
		}
		// compute cumulative frequencies. D is symbol counter for exclusion
		for(F[257]=++x,C[0]=c=0;c<x;)C[c+1]=C[c]+(D[c]=F[c++])
	}
	done=done||function(O){return O};rate=rate||function(){};
	var z=A.length,a=0,b,c=z<3?z:2,e,i,n,o=0,p=A[0]<<8|A[1],B=(cb&=7)|!!up<<4|c<<5,N=0,L=0,R=-1>>>0,fx=1<<(cb+=8),O=[],C=[],D=[],F=[],P=[],S=new Uint8Array(256);
	O.b=pbits;O.c=cbt;bs&=-1>>>8;
	bs=!bs?1<<24:bs<16?1<<bs+9:bs<1024?bs<<10:bs;
	for(;a<z&&a<2;)pbits(8,A[a++]);
	for(;a<z;){
		// decide block size
		b=a+bs;if(b>z)b=z;
		for(c=p,n=a;n<b;c=c<<8&65535|d){
			if(!F[c])F[c]=new Uint16Array(258),C[c]=new Uint32Array(257),D[c]=new Uint16Array(256),P[c]=new Uint8Array(256);
			if(++F[c][d=A[n++]]>=fx)break
		}
		for(;;){
			F[p][256]||newModel(C[p],D[p],F[p],P[p],S); // not write model yet
			// encode
			R=F[p][b=A[a++]]*(c=R/C[p][e=F[p][257]]>>>0);
			for(L+=C[p][b]*c;R<16777216;L=L<<8>>>0,R*=256)
				if(255>L>>>24)
					for(c=L/0x100000000,O[o++]=255&c+B,B=L>>>24,c+=255;N;N--)O[o++]=255&c;
				else++N;
			i=p;p=p<<8&65535|b;
			if(!--D[i][b]) // symbol should be exclude
				if(--F[i][256]){
					if(up)for(c=0;c<e;)C[i][c+1]=C[i][c]+(F[i][c]=D[i][c++]) // update model by counter
				}else{
					up?F[i][b]=0:F[i].fill(0);
					if(a>=n)break // last symbol
				}
		}
	}
	pbits(6,16); // end of marker
	for(a=5;a--;L=L<<8>>>0)
		if(255>L>>>24)
			for(c=L/0x100000000,O[o++]=255&c+B,B=L>>>24,c+=255;N;N--)O[o++]=255&c;
		else++N;
	return done(O,z,o)
}
// decompress
function o2d(A,done,rate){
	function gbits(i,c,b){
		for(c=0;i--;c+=c-b)
			for(R>>>=1,b=L-R>>>31,L-=R&--b;R<16777216;R*=256)L=(L<<8|A[a++])>>>0;
		return c
	}
	function cbt(l,m,n){
		m=(1<<l)-m;n=gbits(l-1);
		if(n>=m)n+=n+gbits(1)-m;
		return n
	}
	function newModel(C,D,F,P,S){
		var b=gbits(2),c,d,e,l,as=0;
		// read symbol table
		if(!b)c=cbt(5,cb+4),c>3&&(c=3+(gbits(c-=4)|1<<c)),F[gbits(8)]=1+c,as++;
		else{
			if(!(l=gbits(4)))return 1;
			if(b<2)
				if(c=cbt(5,20))byDelta(S,as=++c,gbits);
				else for(;c<256;c++)P[c]||(S[as++]=c);
			else if(b<3)
				if(c=cbt(5,20)){
					for(b=0,byDelta(D,c,gbits);b<c;b++)for(d=D[b];b+as<d;)S[as]=b+as++;
					for(;b+as<256;)S[as]=b+as++
				}else for(;as<256;)S[as]=as++
			else for(b=0,e=gbits(1);b<256;e^=1){
				for(c=0,d=l2b(256-b)-1;c<d&&!gbits(1);)c++;
				for(c=c<8?1<<c|gbits(c):256;c--;b++)if(e)S[as++]=b
			}
			// read probability
			if(l<3)b=0;
			else if(l<4)b=gbits(1);
			else if(l<5)b=gbits(1)&&1+gbits(1);
			else b=l<7?gbits(2):cbt(3,5);c=0;
			if(!b)for(;c<as;)F[S[c++]]=1+gbits(l);
			else{
				b<2?vl2dec(D,as,l,O):b<3?vl3dec(D,as,l,O):b<4?vl4dec(D,as,l,O):vlNdec(D,as,l,O);
				for(;c<as;)F[S[c]]=1+D[c++]
			}
		}
		for(C[0]=c=0;c<256;P[c++]=!b,b&&(e=c))C[c+1]=C[c]+(b=D[c]=F[c]);
		F[c]=as;F[257]=e // alphabet size and last symbol+1
	}
	var a=1,b,c=A[0],d,e,o=5,p=0,x,cb=8+(c&7),up=c>>4&1,L,R=-1>>>0,O=[],C=[],D=[],F=[],P=[],S=new Uint8Array(256);
	done=done||function(O){return O};rate=rate||function(){};
	O.b=gbits;O.c=cbt;
	for(;--o;)L=(L<<8|A[a++])>>>0;
	for(c>>=5;o<c;p=p<<8&65535|b)O[o++]=b=gbits(8);
	for(;;p=p<<8&65535|b){
		// not read model yet
		if(!F[p])F[p]=new Uint16Array(258),C[p]=new Uint32Array(257),D[p]=new Uint16Array(256),P[p]=new Uint8Array(256);
		if(!F[p][256]&&newModel(C[p],D[p],F[p],P[p],S))return done(O,A.length,o);
		// decode
		R=R/C[p][x=F[p][257]]>>>0,c=x-1,e=L/R>>>0;
		for(b=0;b<c;C[p][d+1]>e?c=d:b=++d)d=b+c>>1; // binary search
		L-=R*C[p][O[o++]=b];
		for(R*=F[p][b];R<16777216;R*=256)L=(L<<8|A[a++])>>>0;
		// reduce counter
		if(!--D[p][b])
			if(--F[p][256]){
				if(up)for(c=0;c<x;)C[p][c+1]=C[p][c]+(F[p][c]=D[p][c++]) // update model by counter
			}else up?F[p][b]=0:F[p].fill(0)
	}
}