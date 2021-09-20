/**************************************************
	Static Range Coder order0 2021.9.20
***************************************************
implemented progress version.
usage:
	o0e_p(A,cb,bs,up,done,rate)
	@A  :data for compression
	@cb :counter bits(0-7)+8
	@bs :block size. bs==0:1<<24, bs<16:1<<bs+9, bs<1024:bs<<10, or row value
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
	// cbt coding
	function cbt(n,m,l){
		m=(1<<l)-m;
		n<m?--l:n+=m;pbits(l,n)
	}
	done=done||function(O){return O};rate=rate||function(){};
	var a=0,o=0,z=A.length,B=(cb&=7)|!!up<<4,N=0,L=0,R=-1>>>0,as=0,fx=1<<(cb+=8),O=[],C=new Uint32Array(257),D=C.slice(1),F=C.slice(1),S=new Uint8Array(256),P=S.slice();
	O.b=pbits;O.c=cbt;bs&=-1>>>8;
	bs=!bs?1<<24:bs<16?1<<bs+9:bs<1024?bs<<10:bs;
	function _(){
		if(a>=z){
			pbits(2,3),pbits(9,0); // end of marker
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
		if(as<2){pbits(2,0),pbits(8,b=S[as=0]),pbits(cb,~a+n),F[b]=0,a=n;return wait0(_)} // p=1, so no need to encode
		if(b==e)pbits(2,1),pbits(4,0); // current is the same as previous
		else{
			c=toDelta(S,as)+4,d=f?toDelta(D,f)+4:4,e=gammaRLE(F,b); // costs
			if(c<d&&c<e&&as<21)
				pbits(2,1),cbt(as-1,20,5),toDelta(S,as,pbits); // save 2-20sym
			else if(d<c&&d<e&&f<20)
				pbits(2,2),cbt(f,20,5),f&&toDelta(D,f,pbits); // exclude 0-19sym
			else pbits(2,3),gammaRLE(F,b,0,pbits) // encode bit flags by RLE
		}
		D[0]=cb*as;
		D[1]=vl2cost(C,as,cb);
		D[2]=vl3cost(C,as,cb);
		D[3]=vl4cost(C,as,cb);
		for(c=4,x++;I[--c]=c;);
		pbits(2,b=I.sort(function(a,b){return D[a]-D[b]})[0]);
		// write probability
		if(!b)for(;c<as;)pbits(cb,C[c++]);
		else b<2?vl2enc(C,as,cb,O):b<3?vl3enc(C,as,cb,O):vl4enc(C,as,cb,O);
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
	function cbt(l,m,n){
		m=(1<<l)-m;n=gbits(l-1);
		if(n>=m)n+=n+gbits(1)-m;
		return n
	}
	var a=1,b=A[0],o=5,z=A.length,cb=8+(b&7),up=b>>4,L,R=-1>>>0,O=[],C=new Uint32Array(257),D=C.slice(),F=C.slice(1),S=new Uint8Array(256),P=S.slice();
	done=done||function(O){return O};rate=rate||function(){};
	O.b=gbits;O.c=cbt;
	for(;--o;)L=(L<<8|A[a++])>>>0;
	function _(){
		var b=gbits(2),c,d,e,x,as=0;
		// read symbol table
		if(!b){for(P[b=gbits(8)]=0,c=gbits(cb);O[o++]=b,c--;);return wait0(_)}
		if(b<2)
			if(c=cbt(5,20))byDelta(S,as=++c,gbits); // read a few symbols
			else for(;c<256;c++)P[c]||(S[as++]=c); // copy from previous
		else if(b<3)
			if(c=cbt(5,20)){ // exclude a few symbols
				for(b=0,byDelta(D,c,gbits);b<c;b++)for(d=D[b];b+as<d;)S[as]=b+as++;
				for(;b+as<256;)S[as]=b+as++
			}else for(;as<256;)S[as]=as++ // no exclusion
		else{ // read flags
			for(b=0,e=gbits(1);b<256;e^=1){
				for(c=0,d=l2b(256-b)-1;c<d&&!gbits(1);)c++;
				for(c=c<8?1<<c|gbits(c):256;c--;b++)if(e)S[as++]=b
			}
			if(!as)return done(O,z,o)
		}
		// read probability
		b=gbits(2);c=0;
		if(!b)for(;c<as;)F[S[c++]]=1+gbits(cb);
		else{
			b<2?vl2dec(D,as,cb,O):b<3?vl3dec(D,as,cb,O):vl4dec(D,as,cb,O);
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
