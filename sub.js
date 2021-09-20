function l2b(n,b){for(b=0;n>>++b;);return b}

function vl2cost(A,z,l){
	for(var a=z,b=l>>1,c=1<<b,d=(1<<l)-c,n;a;)
		n=A[--a],z+=n<c?b:n-c+d>>l?l:l-1; // 1/2 or full?
	return z
}
function vl3cost(A,z,l){
	for(var a=z,b=0|l/3,c=l-b,d=1<<b,e=1<<c,n;a;)
		if(n=A[--a],n<d)z+=b; // 1/3 of full bits
		else if((n-=d)<e)z+=c+1; // 3/2
		else z+=n+(1<<l)-e-e-d>>l?l+1:l; // 3/3
	return z
}
function vl4cost(A,z,l){
	var a=z,b=l>>2,c=l-b,d=c-b,e=1<<b,f=1<<d,g=1<<c,n;
	for(z+=z;a;)
		if(n=A[--a],n<e)z+=b; // 1/4 of full bits
		else if((n-=e)<f)z+=d; // 2/4
		else if((n-=f)<g)z+=c; // 3/4
		else z+=n+(1<<l)-g-g-f-e>>l?l:l-1; // 4/4
	return z
}
function vlNcost(A,z,l){
	for(var a,b=l<8?2:3,c=1<<b,d,n=b*z;z;n+=--d-l+c?d:l-c+1)
		for(a=A[--z],d=l-c;a>>++d;);
	return n
}
function vl2enc(A,z,l,O){
	for(var a=0,b=l>>1,c=1<<b,d=(1<<l)-c,n;a<z;)
		if(n=A[a++],n<c)O.b(b+1,n);
		else O.b(1,1),O.c(n-c,d,l)
}
function vl3enc(A,z,l,O){
	for(var a=0,b=0|l/3,c=l-b,d=1<<b,e=1<<c,n;a<z;)
		if(n=A[a++],n<d)O.b(b+1,n|1<<b);
		else if((n-=d)<e)O.b(2,1),O.b(c,n);
		else O.b(2,0),O.c(n-e,(1<<l)-e-d,l)
}
function vl4enc(A,z,l,O){
	for(var a=0,b=l>>2,c=l-b,d=c-b,e=1<<b,f=1<<d,g=1<<c,n;a<z;)
		if(n=A[a++],n<e)O.b(2+b,n);
		else if((n-=e)<f)O.b(2,1),O.b(d,n);
		else if((n-=f)<g)O.b(2,2),O.b(c,n);
		else O.b(2,3),O.c(n-g,(1<<l)-g-f-e,l)
}
function vlNenc(A,z,l,O){
	for(var a=0,b=l<8?2:3,c=1<<b,d,e,n;a<z;O.b(d,n)){
		for(n=A[a++],d=l-c;n>>++d;);
		(e=--d-l+c)?n-=1<<d:d=l-c+1,O.b(b,e)
	}
}
function vl2dec(A,z,l,O){
	for(var a=0,b=l>>1,c=1<<b,d=(1<<l)-c;a<z;)
		A[a++]=O.b(1)?O.c(l,d)+c:O.b(b)
}
function vl3dec(A,z,l,O){
	for(var a=0,b=0|l/3,c=l-b,d=1<<b,e=1<<c;a<z;)
		if(O.b(1))A[a++]=O.b(b);
		else if(O.b(1))A[a++]=O.b(c)+d;
		else A[a++]=O.c(l,(1<<l)-e-d)+d+e
}
function vl4dec(A,z,l,O){
	for(var a=0,b=l>>2,c=l-b,d=c-b,e=1<<b,f=1<<d,g=1<<c,n;a<z;)
		if(!(n=O.b(2)))A[a++]=O.b(b);
		else if(n<2)A[a++]=O.b(d)+e;
		else if(n<3)A[a++]=O.b(c)+e+f;
		else A[a++]=O.c(l,(1<<l)-g-f-e)+e+f+g
}
function vlNdec(A,z,l,O){
	for(var a=0,b=l<8?2:3,c=1<<b,d;a<z;)
		A[a++]=(d=O.b(b))?O.b(d+=l-c)|1<<d:O.b(l-c+1)
}
// RLE by gamma code
function gammaRLE(A,z,cmp,enc){
	cmp=cmp||function(a){return!a};
	var a=0,b,c,d,e,f,n=1;
	for(enc&&enc(1,!cmp(A[0]));b=a<z;n+=c){
		for(c=cmp(A[a]),d=l2b(z-a);c==cmp(A[++a])&&a<z;)b++;
		e=c=l2b(f=b);c--<d||(b^=1<<c--); // length limited
		f<256?c+=e:b=0;enc&&enc(c,b)
	}return n // bit cost
}
// delta encode. compression is usually poor, but always even smaller than original size
function toDelta(A,z,enc){
	var a=0,b,c=A[0],d,e,l,n=8;
	for(enc&&enc(8,c);++a<z&&z-a<(e=255-c);c=b)
		b=A[a],d=~c+b,
		l=l2b(e),e=(1<<l)-e,
		d<e?l--:d+=e,enc&&enc(l,d),n+=l;
	return n // bit cost
}
// delta decode
function byDelta(A,z,dec){
	for(var a=1,b,c=A[0]=dec(8),e,l;a<z&&z-a<(e=255-c);A[a++]=c-=~b)
		l=l2b(e),e=(1<<l)-e,
		b=dec(l-1),b<e||(b+=b+dec(1)-e);
	for(;a<z;)A[a++]=++c; // complement up 255-c to 255 while increment is 1
	return A
}