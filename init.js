(function(){
	var F=[],hit="\0";
	window.wait0=function(fn){
		F[F.length]=fn;
		window.postMessage(hit,"*")
	};
	window.onmessage=function(e){
		if(e.source===window&&e.data===hit)
			e.stopPropagation(),
			F[0]&&F.shift()()
	}
})();
(function(){
	var of=document.forms.oform,uf=document.forms.uform,info=document.getElementById("info"),b=document.getElementById("flist"),fn=[o0e_p,o1e_p,o2e_p,o0d_p,o1d_p,o2d_p];
	b.ondrop=uf.upfile.onchange=function(e){b.className="dpass";
		function rate(a,z){sum+=a-rate.a;rate.a=a;info.value=(a/z*1e4|0)/100+"%";info.style.width=(sum/fs*1e4|0)/100+"%"}
		function done(O,a,z){rate(a,a);i+=z;
			f[f.p].e.lastChild.value=a+' to '+z+' in '+(new Date-fr.st)+'ms',
			f[f.p].e.firstChild.href=URL.createObjectURL(new Blob([new Uint8Array(O)])),
			++f.p<f.length?fr.readAsArrayBuffer(f[f.p]):info.value+=", "+fs+" to "+i+"("+(i/fs*1e4|0)/100+"%)"+", "+(new Date-e)+"ms";uf.upfile.value=""
		}
		var f=(e.dataTransfer||e.target).files,i=f.p=0,n,r,sum=0,fs=0,fr=new FileReader,dc=uf.fdec.checked,o=of.order.selectedIndex;
		fr.onload=function(){
			fr.st=new Date;n=new Uint8Array(fr.result);rate.a=0;
			dc?fn[o+3](n,done,rate):fn[o](n,of.cb.value,of.bs.value,of.up.checked,done,rate)
		}
		for(e.preventDefault(e.stopPropagation());e=f[i++];fs+=e.size)
			e.e=r=document.createElement("li"),n=e.name,
			r.innerHTML='<a download="'+n+'.out">'+n+'</a> <input type=button>',
			b.appendChild(r);
		i=0;e=new Date;fr.readAsArrayBuffer(f[f.p])
	};
	b.onclick=function(e){e=e.target||e.srcElement;e.nodeName=="INPUT"&&e.type=="button"&&confirm("remove?")?e.parentNode.outerHTML="":0};
	b.ondragover=function(e){this.className="dover";e.preventDefault();e.dataTransfer.dropEffect='copy'};
	b.ondragleave=function(){this.className="dpass"}
	document.getElementById("kill").onclick=function(){
		info.value="ready..";
		uf.upfile.value=b.innerHTML=""
	}
})()