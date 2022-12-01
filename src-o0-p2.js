/**************************************************
	Static Range Coder order0 2021.10.2
***************************************************
implemented progress version.
usage:
	o0e_p(A,cb,bs,up,done,rate)
	@A  :data for compression
	@cb :counter bits(0-7)+8
	@bs :block size. bs==0:1<<24, bs<16:1<<bs+9, bs<1024:bs<<10, bs>1023:bs
	@up :if true then update static model
	@done: call back for finished
	@rate: call back for progress

	o0d_p(A,done,rate)
	@A  :data for decompression
	@done: call back for finished
	@rate: call back for progress
***************************************************/
// compress
function o0e_p(A,cb,bs,up,done,rate){
	// encode bits(p=0.5)
	function pbits(i,s,c){
		for(;i;)for(L+=(R>>>=1)*(s>>>--i&1);R<16777216;L=L<<8>>>0,R*=256)
			if(255>L>>>24)
				for(c=L/0x100000000,O[o++]=255&c+B,B=L>>>24,c+=255;N;N--)O[o++]=255&c;
			else++N
	}
	// encode 1 bit by variable probability
	function eb(i,b,P){
		var p=P[i],c=(R>>>12)*p;
		b?R=c:(R-=c,L+=c);
		for(P[i]-=(p-(b<<12)>>P.up)+b;R<16777216;L=L<<8>>>0,R*=256)
			if(255>L>>>24)
				for(c=L/0x100000000,O[o++]=255&c+B,B=L>>>24,c+=255;N;N--)O[o++]=255&c;
			else++N
	}
	// encode bits by variable probability
	function eb2(i,s,P){
		for(var b,c=1;i;c+=c+b)eb(c,b=s>>--i&1,P)
	}
	// encode bits by variable probability
	function eb3(i,s,P){for(;i;)eb(--i,s>>i&1,P)}

	// cbt coding + eb2
	function cbt2(n,m,l,P){
		m=(1<<l--)-m;
		if(n<m)eb2(l,n,P)
		else n+=m,eb2(l,n>>1,P),pbits(1,n&1)
	}
	// cbt coding + eb3
	function cbt3(n,m,l,P){
		m=(1<<l--)-m;
		if(n<m)eb3(l,n,P)
		else n+=m,eb3(l,n>>1,P),pbits(1,n&1)
	}
	done=done||function(O){return O};rate=rate||function(){};
	var a=0,o=15,z=A.length,B=(cb&=7)|!!up<<4,N=0,L=0,R=-1>>>0,as=0,fx=1<<(cb+=8),O=[],
		// static model
		C=new Uint32Array(257),D=C.slice(1),F=C.slice(1),S=new Uint8Array(256),P=S.slice(),
		// for header model
		H0=Fp(4,4),H3=Fp(4,4),H5=Fp(16,5),G=[Fp(8,5),Fp(8,5)],
		L1=Fp(cb,5),L2=[],L3=[],L4=[],V2=Fp(8,5),V3=[],V4=[],
		S0=Fp(256,5),S1=Fp(256,4);
	O.b=pbits;O.c3=cbt3;O.e=eb;O.e2=eb2;O.e3=eb3;
	bs&=-1>>>8;bs=!bs?1<<24:bs<16?1<<bs+9:bs<1024?bs<<10:bs;
	// init model
	for(;o;V4[o--]=Fp(5,5))L2[o]=Fp(o,5),L3[o]=Fp(o,5),L4[o]=Fp(o,6),V3[o]=Fp(2,5);
	function _(){
		if(a>=z){
			eb2(2,3,H0),gammaRLE2(F,256,O,G); // end of marker
			for(a=5;a--;L=L<<8>>>0)
				if(255>L>>>24)
					for(c=L/0x100000000,O[o++]=255&c+B,B=L>>>24,c+=255;N;N--)O[o++]=255&c;
				else++N;
			return done(O,z,o)
		}
		// decide block size
		var b=a+bs,c,d,e=0,f=0,n=a,x,I=[];
		if(b>z)b=z;
		for(rate(a,z);n<b&&++F[A[n++]]<fx;);

		// check previous model, collect symbols(+counter)
		for(b=0;b<256;P[b++]=!c)
			c=F[b],P[b]-!c||e++,c?C[as]=F[S[as++]=x=b]-1:D[f++]=b;
		// write symbol table
		if(as<2){eb2(2,0,H0),eb2(8,b=S[as=0],S0),eb3(cb,~a+n,L1),F[b]=0,a=n;return wait0(_)} // p=1, so no need to encode
		if(b==e)eb2(2,1,H0),eb2(4,0,H5); // current is the same as previous
		else{
			c=toDelta(S,as)+4,d=f?toDelta(D,f)+4:4,e=gammaRLE(F,b); // costs
			if(c<d&&c<e&&as<21)
				eb2(2,1,H0),cbt2(as-1,20,5,H5),toDelta2(S,as,O,S0,S1); // save 2-20sym
			else if(d<c&&d<e&&f<20)
				eb2(2,2,H0),cbt2(f,20,5,H5),f&&toDelta2(D,f,O,S0,S1); // exclude 0-19sym
			else eb2(2,3,H0),gammaRLE2(F,b,O,G) // encode bit flags by RLE
		}
		D[0]=cb*as;
		D[1]=vl2cost(C,as,cb);
		D[2]=vl3cost(C,as,cb);
		D[3]=vl4cost(C,as,cb);
		for(c=4,x++;I[--c]=c;);
		eb2(2,b=I.sort(function(a,b){return D[a]-D[b]})[0],H3);
		// write probability
		if(!b)for(;c<as;)pbits(cb,C[c++]);
		else b<2?vl2enc(C,as,cb,O,L2,V2):b<3?vl3enc(C,as,cb,O,L3,V3):vl4enc(C,as,cb,O,L4,V4);
		// compute cumulative frequencies. D is symbol counter for exclusion
		for(C[0]=c=0;c<x;)C[c+1]=C[c]+(D[c]=F[c++]);
		for(;;){
			// encode
			R=F[b=A[a++]]*(c=R/C[x]>>>0);
			for(L+=C[b]*c;R<16777216;L=L<<8>>>0,R*=256)
				if(255>L>>>24)
					for(c=L/0x100000000,O[o++]=255&c+B,B=L>>>24,c+=255;N;N--)O[o++]=255&c;
				else++N;
			if(!--D[b]){// symbol should be exclude
				if(!--as){up?F[b]=0:F.fill(0);break} // last symbol
				if(up)for(c=0;c<x;)C[c+1]=C[c]+(F[c]=D[c++]) // update model by counter
			}
		}wait0(_)
	}return wait0(_)
}
// decompress
function o0d_p(A,done,rate){
	function gbits(i,c,b){
		for(c=0;i--;c+=c-b)
			for(R>>>=1,b=L-R>>>31,L-=R&--b;R<16777216;R*=256)L=(L<<8|A[a++])>>>0;
		return c
	}
	function db(i,P){
		var p=P[i],c=(R>>>12)*p,b=1;
		L<c?R=c:(R-=c,L-=c,b=0);
		for(P[i]-=(p-(b<<12)>>P.up)+b;R<16777216;R*=256)L=(L<<8|A[a++])>>>0;
		return b
	}
	function db2(i,P,c,d){for(c=1,d=i;i--;)c+=c+db(c,P);return c^1<<d}
	function db3(i,P,c){for(c=0;i--;)c+=db(i,P)<<i;return c}

	function cbt2(P,l,m,n){
		m=(1<<l)-m;n=db2(l-1,P);
		if(n>=m)n+=n+gbits(1)-m;
		return n
	}
	function cbt3(P,l,m,n){
		m=(1<<l)-m;n=db3(l-1,P);
		if(n>=m)n+=n+gbits(1)-m;
		return n
	}
	var a=1,b=A[0],o=5,z=A.length,cb=8+(b&7),up=b>>4,L,R=-1>>>0,O=[],
		// static model
		C=new Uint32Array(257),D=C.slice(),F=C.slice(1),S=new Uint8Array(256),P=S.slice(),
		// for header model
		H0=Fp(4,4),H3=Fp(4,4),H5=Fp(16,5),G=[Fp(8,5),Fp(8,5)],
		L1=Fp(cb,5),L2=[],L3=[],L4=[],V2=Fp(8,5),V3=[],V4=[],
		S0=Fp(256,5),S1=Fp(256,4);

	done=done||function(O){return O};rate=rate||function(){};
	O.b=gbits;O.c2=cbt2;O.c3=cbt3;O.d=db;O.d2=db2;O.d3=db3;
	for(;--o;)L=(L<<8|A[a++])>>>0;
	for(b=15;b;V4[b--]=Fp(5,5))L2[b]=Fp(b,5),L3[b]=Fp(b,5),L4[b]=Fp(b,6),V3[b]=Fp(2,5);
	function _(){
		var b=db2(2,H0),c,d,e,x,as=0;
		// read symbol table
		if(!b){for(P[b=db2(8,S0)]=0,c=db3(cb,L1);O[o++]=b,c--;);return wait0(_)}
		if(b<2)
			if(c=cbt2(H5,5,20))byDelta2(S,as=++c,O,S0,S1); // read a few symbols
			else for(;c<256;c++)P[c]||(S[as++]=c); // copy from previous
		else if(b<3)
			if(c=cbt2(H5,5,20)){ // exclude a few symbols
				for(b=0,byDelta2(D,c,O,S0,S1);b<c;b++)for(d=D[b];b+as<d;)S[as]=b+as++;
				for(;b+as<256;)S[as]=b+as++
			}else for(;as<256;)S[as]=as++ // no exclusion
		else{ // read flags
			for(e=db(7,G[b=0]);b<256;e^=1){
				for(c=0,d=l2b(256-b)-1;c<d&&!db(c,G[0]);)c++;
				if(d=1<<c,c<8)for(;c;)d+=db(--c,G[1])<<c;
				for(;d--;b++)if(e)S[as++]=b
			}if(!as)return done(O,z,o)
		}
		// read probability
		b=db2(2,H3);c=0;
		if(!b)for(;c<as;)F[S[c++]]=1+gbits(cb);
		else{
			b<2?vl2dec(D,as,cb,O,L2,V2):b<3?vl3dec(D,as,cb,O,L3,V3):vl4dec(D,as,cb,O,L4,V4);
			for(;c<as;)F[S[c]]=1+D[c++]
		}
		for(C[0]=c=0;c<256;P[c++]=!b,b&&(x=c))C[c+1]=C[c]+(b=D[c]=F[c]);
		for(rate(a,z);;){
			// decode
			R=R/C[x]>>>0,b=x-1,e=L/R>>>0;
			for(c=0;c<b;C[d+1]>e?b=d:c=++d)d=c+b>>1; // binary search
			L-=R*C[O[o++]=c];
			for(R*=F[c];R<16777216;R*=256)L=(L<<8|A[a++])>>>0;
			// reduce counter
			if(!--D[c]){
				if(!--as){up?F[c]=0:F.fill(0);break}
				if(up)for(c=0;c<x;)C[c+1]=C[c]+(F[c]=D[c++])
			}
		}wait0(_)
	}return wait0(_)
}