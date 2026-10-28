// Preserve both the visible board's ratio and pointer-coordinate mapping.
export function boardSize(width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return null;
 const w=Math.min(width,height*440/640);
 return {width:w,height:w*640/440};
}
