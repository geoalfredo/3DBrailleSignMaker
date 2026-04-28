var debug = false;
var parameters = null;
var master_dot = null;

var colorDot = [0.2, 0.2, 0.2];
var colorPlate = [1.0, 1.0, 1.0];
var colorInside = [0.0, 0.0, 0.0];
var colorSupport = [0.7, 1, 0.7];
var colorLatin = [0.2, 0.2, 0.2];
// Versão 2.1 esquerda: texto latino por traços, alinhado à esquerda, e Braille abaixo.

var characters =
{
	"a" : 1,	//⠁
	"b" : 12,	//⠃
	"c" : 14,	//⠉
	"d" : 145,	//⠙
	"e" : 15,	//⠑
	"f" : 124,	//⠋
	"g" : 1245,	//⠛
	"h" : 125,	//⠓
	"i" : 24,	//⠊
	"j" : 245,	//⠚
	"k" : 13,	//⠅
	"l" : 123,	//⠇
	"m" : 134,	//⠍
	"n" : 1345,	//⠝
	"o" : 135,	//⠕
	"p" : 1234,	//⠏
	"q" : 12345,//⠟
	"r" : 1235,	//⠗
	"s" : 234,	//⠎
	"t" : 2345,	//⠞
	"u" : 136,	//⠥
	"v" : 1236,	//⠧
	"w" : 2456,	//⠺
	"x" : 1346,	//⠭
	"y" : 13456,//⠽
	"z" : 1356,	//⠵

	"1" : 1,	//⠁
	"2" : 12,	//⠃
	"3" : 14,	//⠉
	"4" : 145,	//⠙
	"5" : 15,	//⠑
	"6" : 124,	//⠋
	"7" : 1245,	//⠛
	"8" : 125,	//⠓
	"9" : 24,	//⠊
	"0" : 245,	//⠚
	
	"ç" : 12346,  // 
	"é" : 123456,
	"á" : 12356,
	"è" : 2346,
	"ú" : 23456,
	"â" : 16,
	"ê" : 126,
	"ì" : 146,
	"ô" : 1456,
	"@" : 156,
	"à" : 1246,
	"ñ" : 12456,
	"ü" : 1256,
	"õ" : 246,
	"w" : 2456,
	"í" : 34,
	"ã" : 345,
	"ó" : 346,
	
	"&" : 12346,//⠯
	"%" : 123456,//⠿
	"[" : 12356,//⠷
	"]" : 23456,//⠾
	"`" : 1246,	//⠫
	"^" : 12456,//⠻
	"#" : 3456,	//⠼
	"$" : 46,	//⠨
	"." : 3,	//⠄
	"," : 2,	//⠂
	":" : 25,	//⠒
	";" : 23,	//⠆
	">" : 45,	//⠘
	"<" : 56,	//⠰
	"»" : 236,	//⠦
	"«" : 356,	//⠴
	"(" : 2356,	//⠶
	")" : 2356,	//⠶
	"=" : 2356,	//⠶
	"-" : 36,	//⠤
	"+" : 235,	//⠖
	"!" : 235,	//⠖
	"*" : 35,	//⠔
	"/" : 256,	//⠲
	"?" : 26,	//⠢
	//"'" : 6,	//⠠
	//'"' : 4,	//⠈
	"_" : 456,	//⠸
	"~" : 5,	//⠐
	"§" : 346,	//⠬
	" " : 0,	//⠀
	"º" : 356,
	"|" : 456
};

function log(text)
{
	if (OpenJsCad.log && debug)
		OpenJsCad.log(text);
}

function form_base()
{
	if (parameters.plate_thickness <= 0.0)
		return new CSG();
	
	var dimensions = [parameters.form_distance/2, parameters.line_height/2, parameters.plate_thickness/2];
	var offset = [parameters.form_distance/2, -parameters.line_height/2, -parameters.plate_thickness/2];
	
	return CSG.cube({ center: offset, radius: dimensions });
}

function rotateZ_extrude(obj2d, resolution)
{
	return obj2d.solidFromSlices({
		numslices: resolution,
		loop : true,
		callback: function(t, slice) {
			return this.rotateZ(360/resolution*slice);
		}
	});
}

function ring(radius1, radius2, resolution)
{	
	points = new Array(resolution);
	for (var i=0; i<resolution; i++)
	{
		var t = i/resolution;
		var angle = Math.PI * 2 * t;
		var x = radius1 * Math.cos(angle);
		var z = radius1 * Math.sin(angle);
		points[i] = [x,0,z];
	}
	
	var circle = CSG.Polygon.createFromPoints(points).translate([radius2-radius1,0,0]);
	return rotateZ_extrude(circle, resolution);
}

function sized_dot()
{
	if (master_dot == null)
	{
		var dot;
		if (parameters.dot_shape == 'sphere')
		{
			dot = CSG.sphere({ center: [0, 0, 0], radius: 1, resolution: parameters.resolution });
			var sub = CSG.cube({ center: [0, 0, 0], radius: [1.25, 1.25, 1] }).translate([0, 0, -1.05]);
			dot = dot.subtract(sub);
		}
		else if (parameters.dot_shape == 'cylinder')
		{
			dot = CSG.cylinder({ start: [0, 0, -0.05], end: [0, 0, 1], radius: 1, resolution: parameters.resolution });
		}
		else if (parameters.dot_shape == 'smooth')
		{
			dot = CSG.sphere({ center: [0, 0, 1], radius: 1, resolution: parameters.resolution });
			dot = dot.scale([1, 1, 0.5]);
		}
		else
		{
			throw new Error("Unknown dot shape '" + parameters.dot_shape + "'");
		}
		
		dot = dot.scale([parameters.dot_diameter/2, parameters.dot_diameter/2, parameters.dot_height]);
		dot = dot.setColor(colorDot[0], colorDot[1], colorDot[2]);
		
		//final touch of 'smooth' is best done after scaling
		if (parameters.dot_shape == 'smooth')
		{
			var ringRadius1 = parameters.dot_height / 2;
			var ringRadius2 = parameters.dot_diameter/2 + parameters.dot_height;
			
			var base = CSG.cylinder({ start: [0, 0, -0.05], end: [0, 0, ringRadius1], radius: ringRadius2-ringRadius1, resolution: parameters.resolution });
			base = base.setColor(colorPlate[0], colorPlate[1], colorPlate[2]);
			var smoother = ring(ringRadius1, ringRadius2, parameters.resolution).translate([0, 0, ringRadius1]);
			smoother = smoother.setColor(colorPlate[0], colorPlate[1], colorPlate[2]);
			dot = dot.union(base).subtract(smoother);
		}
		
		master_dot = dot;
	}
	return CSG.fromObject(master_dot);
}

function dot(x, y)
{
	var x_pos = (parameters.form_distance - parameters.dot_distance) / 2 + (x-1) * parameters.dot_distance;
	var y_pos = -(parameters.line_height - parameters.dot_distance*2) / 2 - (y-1) * parameters.dot_distance;
	
	var the_dot = sized_dot();
	the_dot = the_dot.translate([x_pos, y_pos, 0]);
	
	return the_dot;
}

function characterByCode(charCode)
{
	var dotArray = [];
	
	while (charCode > 0)
	{
		var dotCode = (charCode % 10) - 1;
		charCode = Math.floor(charCode / 10);
		if (dotCode < 0)
			continue;
		
		dotArray.unshift([dotCode < 3 ? 1 : 2, (dotCode % 3) + 1]);
	}
	
	return characterByDots(dotArray);
}

function characterByDots(dots)
{
	var theCharacter = new Array(dots.length);
	
	for (var i=0; i < dots.length; i++)
	{
		theCharacter[i] = dot(dots[i][0], dots[i][1]);
	}
	
	return theCharacter;
}


function cleanLatinText(text)
{
	// Versão para português: mantém acentos e ç no texto latino em relevo.
	var allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ÁÀÃÂÉÈÊÍÌÎÓÒÕÔÚÙÛÇáàãâéèêíìîóòõôúùûç.,:;!?-/()ºª\n";
	var result = "";
	for (var i=0; i<text.length; i++)
	{
		var ch = text.charAt(i);
		result += (allowed.indexOf(ch) >= 0) ? ch : "?";
	}
	return result;
}



// Fonte geométrica por traços, mais próxima de letras vetoriais.
// Não usa vector_text, pois a versão antiga do OpenJSCAD deste app não possui essa função.
// Cada letra é composta por segmentos retangulares finos em relevo.
var latinStrokeFont = {
	"A":{w:5,s:[[0,7,2.5,0],[5,7,2.5,0],[1.2,4,3.8,4]]},
	"B":{w:5,s:[[0,0,0,7],[0,0,3.4,0],[3.4,0,4.5,1],[4.5,1,4.5,2.7],[4.5,2.7,3.4,3.5],[0,3.5,3.4,3.5],[3.4,3.5,4.6,4.4],[4.6,4.4,4.6,6],[4.6,6,3.4,7],[0,7,3.4,7]]},
	"C":{w:5,s:[[4.5,0.5,3.5,0],[3.5,0,1,0],[1,0,0,1],[0,1,0,6],[0,6,1,7],[1,7,3.5,7],[3.5,7,4.5,6.5]]},
	"D":{w:5,s:[[0,0,0,7],[0,0,3.2,0],[3.2,0,4.5,1.2],[4.5,1.2,4.5,5.8],[4.5,5.8,3.2,7],[0,7,3.2,7]]},
	"E":{w:5,s:[[0,0,0,7],[0,0,4.7,0],[0,3.5,3.8,3.5],[0,7,4.7,7]]},
	"F":{w:5,s:[[0,0,0,7],[0,0,4.7,0],[0,3.5,3.8,3.5]]},
	"G":{w:5,s:[[4.5,0.8,3.6,0],[3.6,0,1,0],[1,0,0,1],[0,1,0,6],[0,6,1,7],[1,7,3.7,7],[3.7,7,4.7,6],[4.7,6,4.7,4.2],[4.7,4.2,2.7,4.2]]},
	"H":{w:5,s:[[0,0,0,7],[5,0,5,7],[0,3.5,5,3.5]]},
	"I":{w:3,s:[[0,0,3,0],[1.5,0,1.5,7],[0,7,3,7]]},
	"J":{w:5,s:[[1,0,5,0],[3.5,0,3.5,6],[3.5,6,2.5,7],[2.5,7,1,7],[1,7,0,6]]},
	"K":{w:5,s:[[0,0,0,7],[5,0,0,3.7],[0,3.7,5,7]]},
	"L":{w:5,s:[[0,0,0,7],[0,7,4.6,7]]},
	"M":{w:6,s:[[0,7,0,0],[0,0,3,3.2],[3,3.2,6,0],[6,0,6,7]]},
	"N":{w:5,s:[[0,7,0,0],[0,0,5,7],[5,7,5,0]]},
	"O":{w:5,s:[[1,0,4,0],[4,0,5,1],[5,1,5,6],[5,6,4,7],[4,7,1,7],[1,7,0,6],[0,6,0,1],[0,1,1,0]]},
	"P":{w:5,s:[[0,0,0,7],[0,0,3.6,0],[3.6,0,4.7,1],[4.7,1,4.7,2.8],[4.7,2.8,3.6,3.6],[0,3.6,3.6,3.6]]},
	"Q":{w:5,s:[[1,0,4,0],[4,0,5,1],[5,1,5,6],[5,6,4,7],[4,7,1,7],[1,7,0,6],[0,6,0,1],[0,1,1,0],[3.1,5.2,5.2,7.3]]},
	"R":{w:5,s:[[0,0,0,7],[0,0,3.6,0],[3.6,0,4.7,1],[4.7,1,4.7,2.8],[4.7,2.8,3.6,3.6],[0,3.6,3.6,3.6],[2.5,3.6,5,7]]},
	"S":{w:5,s:[[4.5,0.5,3.6,0],[3.6,0,1,0],[1,0,0,1],[0,1,0.8,3],[0.8,3,3.8,4],[3.8,4,4.7,5.2],[4.7,5.2,3.7,7],[3.7,7,1,7],[1,7,0.2,6.4]]},
	"T":{w:5,s:[[0,0,5,0],[2.5,0,2.5,7]]},
	"U":{w:5,s:[[0,0,0,6],[0,6,1,7],[1,7,4,7],[4,7,5,6],[5,6,5,0]]},
	"V":{w:5,s:[[0,0,2.5,7],[5,0,2.5,7]]},
	"W":{w:7,s:[[0,0,1.3,7],[1.3,7,3.5,3.8],[3.5,3.8,5.7,7],[5.7,7,7,0]]},
	"X":{w:5,s:[[0,0,5,7],[5,0,0,7]]},
	"Y":{w:5,s:[[0,0,2.5,3.5],[5,0,2.5,3.5],[2.5,3.5,2.5,7]]},
	"Z":{w:5,s:[[0,0,5,0],[5,0,0,7],[0,7,5,7]]},
	"0":{w:5,s:[[1,0,4,0],[4,0,5,1],[5,1,5,6],[5,6,4,7],[4,7,1,7],[1,7,0,6],[0,6,0,1],[0,1,1,0],[1.2,6,3.8,1]]},
	"1":{w:3,s:[[1.5,0,1.5,7],[0.5,1,1.5,0],[0.5,7,2.7,7]]},
	"2":{w:5,s:[[0.5,1,1.3,0],[1.3,0,4,0],[4,0,5,1],[5,1,4.2,2.6],[4.2,2.6,0,7],[0,7,5,7]]},
	"3":{w:5,s:[[0.3,0,4.5,0],[4.5,0,2.7,3.3],[2.7,3.3,4.6,3.9],[4.6,3.9,4.8,6],[4.8,6,3.7,7],[3.7,7,0.5,7]]},
	"4":{w:5,s:[[4,0,4,7],[0,4.5,5,4.5],[0,4.5,4,0]]},
	"5":{w:5,s:[[5,0,0.5,0],[0.5,0,0,3.5],[0,3.5,3.8,3.5],[3.8,3.5,5,4.6],[5,4.6,4.6,6],[4.6,6,3.5,7],[3.5,7,0.5,7]]},
	"6":{w:5,s:[[4.4,0.5,3.4,0],[3.4,0,1,0.5],[1,0.5,0,2.5],[0,2.5,0,6],[0,6,1,7],[1,7,4,7],[4,7,5,6],[5,6,5,4.6],[5,4.6,4,3.5],[4,3.5,0,3.5]]},
	"7":{w:5,s:[[0,0,5,0],[5,0,1.5,7]]},
	"8":{w:5,s:[[1,0,4,0],[4,0,5,1],[5,1,4.2,3.3],[4.2,3.3,1,3.3],[1,3.3,0,1],[0,1,1,0],[1,3.3,0,5.8],[0,5.8,1,7],[1,7,4,7],[4,7,5,5.8],[5,5.8,4.2,3.3]]},
	"9":{w:5,s:[[5,4.5,4,6.8],[4,6.8,1,7],[1,7,0,6],[0,6,0,4.5],[0,4.5,1,3.5],[1,3.5,5,3.5],[5,3.5,5,1],[5,1,4,0],[4,0,1,0],[1,0,0.2,0.5]]},
	"-":{w:4,s:[[0,3.5,4,3.5]]},
	".":{w:2,s:[[1,6.6,1,7]]},
	",":{w:2,s:[[1,6.5,0.4,7.7]]},
	":":{w:2,s:[[1,2,1,2.2],[1,5.5,1,5.7]]},
	"/":{w:5,s:[[5,0,0,7]]},
	"?":{w:5,s:[[0.5,1,1.5,0],[1.5,0,3.8,0],[3.8,0,4.8,1],[4.8,1,4.2,2.4],[4.2,2.4,2.5,3.7],[2.5,5.2,2.5,5.4]]},
	" ":{w:3,s:[]}
};

// Complemento para português: acentos e cedilha para teclado ABNT2.
function cloneSegments(segs)
{
	var out = [];
	for (var i=0; i<segs.length; i++)
		out.push([segs[i][0], segs[i][1], segs[i][2], segs[i][3]]);
	return out;
}

function accentedLatin(base, accent)
{
	var baseData = latinStrokeFont[base];
	var segs = cloneSegments(baseData.s);
	var w = baseData.w;
	var cx = w / 2.0;
	if (accent == "acute")
		segs.push([cx-0.6, -0.55, cx+0.8, -1.35]);
	else if (accent == "grave")
		segs.push([cx+0.6, -0.55, cx-0.8, -1.35]);
	else if (accent == "circumflex")
	{
		segs.push([cx-1.0, -0.55, cx, -1.35]);
		segs.push([cx, -1.35, cx+1.0, -0.55]);
	}
	else if (accent == "tilde")
	{
		segs.push([cx-1.4, -0.95, cx-0.6, -1.35]);
		segs.push([cx-0.6, -1.35, cx+0.2, -0.55]);
		segs.push([cx+0.2, -0.55, cx+1.2, -0.95]);
	}
	else if (accent == "cedilla")
	{
		segs.push([cx+0.1, 7.05, cx-0.35, 7.65]);
		segs.push([cx-0.35, 7.65, cx+0.35, 8.15]);
	}
	return {w:w, s:segs};
}

latinStrokeFont["Á"] = accentedLatin("A", "acute");
latinStrokeFont["À"] = accentedLatin("A", "grave");
latinStrokeFont["Â"] = accentedLatin("A", "circumflex");
latinStrokeFont["Ã"] = accentedLatin("A", "tilde");
latinStrokeFont["É"] = accentedLatin("E", "acute");
latinStrokeFont["È"] = accentedLatin("E", "grave");
latinStrokeFont["Ê"] = accentedLatin("E", "circumflex");
latinStrokeFont["Í"] = accentedLatin("I", "acute");
latinStrokeFont["Ì"] = accentedLatin("I", "grave");
latinStrokeFont["Î"] = accentedLatin("I", "circumflex");
latinStrokeFont["Ó"] = accentedLatin("O", "acute");
latinStrokeFont["Ò"] = accentedLatin("O", "grave");
latinStrokeFont["Ô"] = accentedLatin("O", "circumflex");
latinStrokeFont["Õ"] = accentedLatin("O", "tilde");
latinStrokeFont["Ú"] = accentedLatin("U", "acute");
latinStrokeFont["Ù"] = accentedLatin("U", "grave");
latinStrokeFont["Û"] = accentedLatin("U", "circumflex");
latinStrokeFont["Ç"] = accentedLatin("C", "cedilla");
latinStrokeFont[";"] = {w:2,s:[[1,2,1,2.2],[1,5.5,0.4,6.9]]};
latinStrokeFont["!"] = {w:2,s:[[1,0,1,5.2],[1,6.6,1,7]]};
latinStrokeFont["("] = {w:3,s:[[2.5,0,1.2,1.2],[1.2,1.2,0.8,3.5],[0.8,3.5,1.2,5.8],[1.2,5.8,2.5,7]]};
latinStrokeFont[")"] = {w:3,s:[[0.5,0,1.8,1.2],[1.8,1.2,2.2,3.5],[2.2,3.5,1.8,5.8],[1.8,5.8,0.5,7]]};
latinStrokeFont["º"] = {w:3,s:[[0.8,0.2,2.2,0.2],[2.2,0.2,2.6,0.6],[2.6,0.6,2.6,1.8],[2.6,1.8,2.2,2.2],[2.2,2.2,0.8,2.2],[0.8,2.2,0.4,1.8],[0.4,1.8,0.4,0.6],[0.4,0.6,0.8,0.2]]};
latinStrokeFont["ª"] = {w:3,s:[[0.5,2.2,1.1,1.2],[1.1,1.2,2.4,1.2],[2.4,1.2,2.4,2.2],[2.4,2.2,1.0,2.2],[1.0,2.2,0.5,1.8],[2.4,1.2,2.4,2.8]]};

function latinCharData(ch)
{
	ch = ch.toUpperCase();
	if (typeof latinStrokeFont[ch] != "undefined")
		return latinStrokeFont[ch];
	return latinStrokeFont["?"];
}

function latinLineWidth(line)
{
	var cell = parameters.latin_size / 7.0;
	var spacing = cell * 1.15;
	var width = 0;
	for (var i=0; i<line.length; i++)
	{
		var data = latinCharData(line.charAt(i));
		width += data.w * cell;
		if (i < line.length-1)
			width += spacing;
	}
	return width;
}

function latinStrokeSegment(x1, y1, x2, y2, scale, xOffset, yTop)
{
	var sx1 = xOffset + x1 * scale;
	var sy1 = yTop - y1 * scale;
	var sx2 = xOffset + x2 * scale;
	var sy2 = yTop - y2 * scale;
	var dx = sx2 - sx1;
	var dy = sy2 - sy1;
	var length = Math.sqrt(dx*dx + dy*dy);
	if (length < 0.001)
		length = parameters.latin_stroke_width;
	var angle = Math.atan2(dy, dx) * 180.0 / Math.PI;
	var zHeight = parameters.latin_height;
	var stroke = parameters.latin_stroke_width;
	var obj = CSG.cube({ center: [0, 0, zHeight/2], radius: [length/2, stroke/2, zHeight/2] });
	obj = obj.rotateZ(angle).translate([(sx1+sx2)/2, (sy1+sy2)/2, 0]);
	return obj.setColor(colorDot[0], colorDot[1], colorDot[2]);
}

function latinTextObject(text, plateWidth, y)
{
	if (!parameters.latin_enabled)
		return new CSG();

	var cleanText = cleanLatinText(text);
	var lines = cleanText.split("\n");
	var result = new CSG();
	var cell = parameters.latin_size / 7.0;
	var spacing = cell * 1.15;
	var lineHeight = parameters.latin_size * 1.45;

	for (var i=0; i<lines.length; i++)
	{
		var line = lines[i];
		var x = parameters.plate_margin; // alinhado à esquerda
		var yTop = y - i * lineHeight;
		for (var c=0; c<line.length; c++)
		{
			var data = latinCharData(line.charAt(c));
			for (var s=0; s<data.s.length; s++)
			{
				var seg = data.s[s];
				result = result.union(latinStrokeSegment(seg[0], seg[1], seg[2], seg[3], cell, x, yTop));
			}
			x += data.w * cell + spacing;
		}
	}

	return result;
}

function latinTextDimensions(text)
{
	if (!parameters.latin_enabled)
		return [0, 0];

	var cleanText = cleanLatinText(text);
	var lines = cleanText.split("\n");
	var lineHeight = parameters.latin_size * 1.45;
	var width = 0;

	for (var i=0; i<lines.length; i++)
		width = Math.max(width, latinLineWidth(lines[i]));

	return [width, lines.length * lineHeight];
}

function generate(text)
{
	log("generating:\n" + text);

	var originalText = text; // usado para escrever o alfabeto latino em relevo

	if (!parameters.upper)
		text = text.toLowerCase();

	var result = new CSG();
	if (text.length == 0)
		return result;

	var find;
	var replace;

	//we want uniform newlines for further processing!
	find = /\n\r|\r\n|\r/g;
	replace = "\n";
	text = text.replace(find, replace);
	originalText = originalText.replace(find, replace);

	if (!parameters.straight)
	{
		//single uppercase letters are prefaced by the character $
		find = /([A-ZÄÖÜ])/g;
		replace = "$$$1";
		text = text.replace(find, replace).toLowerCase();

		//numbers are prefaced by the character #
		find = /([\d]+)/g;
		replace = "#$1";
		text = text.replace(find, replace);

		//is the number followed by a character between 'a' and 'j', a ' is inserted to avoid confusion
		find = /([\d])(?=[a-j])/g;
		replace = "$1'";
		text = text.replace(find, replace);

		//replace quotes with opening and closing quotes
		find = /"([^"]*)"/g;
		replace = "»$1«";
		text = text.replace(find, replace);
	}

	//take care of contractions. they are marked by underlines (_xy_), thus _ needs to be escaped (__)
	find = /(_)/g;
	replace = "$1$1";
	text = text.replace(find, replace);

	if (parameters.contractions)
	{
		find = /(st|au|eu|ei|sch|ch|äu|ie)/g;
		replace = "_$1_";
		text = text.replace(find, replace);
	}

	log("converting to:\n" + text);

	var numLines = 1;
	var textWidth = 0;
	var lineWidth = 0;
	var theCharacters = [];

	var latinDims = latinTextDimensions(originalText);
	var extraLatinHeight = parameters.latin_enabled ? (latinDims[1] + parameters.latin_gap) : 0;
	var offset = new CSG.Vector3D(0, -parameters.plate_margin - extraLatinHeight, 0);

	var isMultiCharForm = false;
	var multiChars = "";

	for (var c=0; c < text.length; c++)
	{
		var newCharacter = text.charAt(c);

		var multiChar = newCharacter == '_';
		if (isMultiCharForm)
		{
			if (multiChar)
			{
				newCharacter = (multiChars.length == 0) ? "_" : multiChars;
				isMultiCharForm = false;
				multiChars = "";
			}
			else
			{
				multiChars += newCharacter;
				continue;
			}
		}
		else if (multiChar)
		{
			isMultiCharForm = true;
			continue;
		}
		else if (newCharacter == "\n")
		{
			numLines++;
			lineWidth = 0;
			log("\n");
			continue;
		}

		lineWidth++;

		var charCode = characters[newCharacter];

		if (typeof charCode == "undefined")
		{
			charCode = characters["?"];
			throw new Error("Unsupported character '" + newCharacter + "'");
		}

		if (charCode > 0)
			textWidth = Math.max(textWidth, lineWidth);

		var characterDots = characterByCode(charCode);
		var position = offset.plus(new CSG.Vector3D(parameters.form_distance * (lineWidth-1), parameters.line_height * -(numLines-1), 0));
		for (var cp=0; cp < characterDots.length; cp++)
			characterDots[cp] = characterDots[cp].translate([position.x, position.y, position.z]);

		theCharacters = theCharacters.concat(characterDots);

		log(newCharacter);
	}

	var brailleWidth = textWidth * parameters.form_distance;
	var brailleHeight = numLines * parameters.line_height;
	var plateWidth = Math.max(brailleWidth, latinDims[0]) + parameters.plate_margin * 2;
	var brailleStartX = parameters.plate_margin; // Braille também alinhado à esquerda
	for (var tc=0; tc<theCharacters.length; tc++)
		theCharacters[tc] = theCharacters[tc].translate([brailleStartX, 0, 0]);
	var plateHeight = extraLatinHeight + brailleHeight + parameters.plate_margin * 2;

	result = CSG.cube({
		center: [plateWidth/2, -plateHeight/2, -parameters.plate_thickness/2],
		radius: [plateWidth/2, plateHeight/2, parameters.plate_thickness/2]
	});
	result = result.setColor(colorPlate[0], colorPlate[1], colorPlate[2]);

	if (parameters.latin_enabled)
	{
		var latin = latinTextObject(originalText, plateWidth, -parameters.plate_margin);
		result = result.union(latin);
	}

	result = result.union(theCharacters);

	if (parameters.reference_corner && parameters.plate_margin > 0)
	{
		var cornerCut = CSG.cube({ center: [0, 0, 0], radius: [parameters.plate_margin, parameters.plate_margin/2, parameters.plate_thickness] }).rotateZ(45);
		cornerCut = cornerCut.setColor(colorInside[0], colorInside[1], colorInside[2]);
		result = result.subtract(cornerCut);
	}

	var dimensions = [plateWidth, plateHeight];
	result = result.translate([-dimensions[0]/2, dimensions[1], 0]).rotateX(90);

	if (parameters.stands)
	{
		var standDiameter = 10.0;
		var standHeight = 0.3;
		var bounds = result.getBounds();
		var standCircle = CSG.cylinder({ start: [0, 0, 0], end: [0, 0, standHeight], radius: standDiameter/2, resolution: parameters.resolution });
		var stand = CSG.cube({ center: [0, parameters.plate_thickness/2, standHeight/2], radius: [bounds[1].x + standDiameter/2, parameters.plate_thickness/2, standHeight/2] });
		stand = stand.union(standCircle.translate([bounds[0].x - standDiameter/2, parameters.plate_thickness/2, 0]));
		stand = stand.union(standCircle.translate([bounds[1].x + standDiameter/2, parameters.plate_thickness/2, 0]));
		stand = stand.setColor(colorSupport[0], colorSupport[1], colorSupport[2]);

		result = result.union(stand);
	}

	return result;
}


function getParameterDefinitions()
{
	var debug = false;
	
	var parameterDefinitions = [
		{ name: 'text', caption: 'Texto', type: 'longtext', initial: 'Olá Mundo' },
		{ name: 'latin_enabled', caption: 'Gerar texto em alfabeto latino acima do Braille?', type: 'bool', initial: true },
		{ name: 'latin_size', caption: 'Altura do texto latino (mm):', type: 'float', initial: 7.0 },
		{ name: 'latin_height', caption: 'Altura do relevo do texto latino (mm):', type: 'float', initial: 0.6 },
		{ name: 'latin_stroke_width', caption: 'Espessura do traço do texto latino (mm):', type: 'float', initial: 0.45 },
		{ name: 'latin_gap', caption: 'Espaço entre texto latino e Braille (mm):', type: 'float', initial: 3.0 },
		{ name: 'upper', caption: 'Maiúsculo', type: 'bool', initial: false },
		{ name: 'contractions', caption: 'Contrações', type: 'bool', initial: false, visible: false },
		{ name: 'straight', caption: 'Conversão direta', type: 'bool', initial: false, visible: false },
	
		{ name: 'form_size', caption: 'Tamanho do formulário [0mm - 10mm]', type: 'float', initial: 5.0, visible: false },
	    { name: 'dot_distance', caption: 'Distância entre pontos [default: 2.7mm]:', type: 'float', initial: 2.7, begin: 1.6, end: 2.7, step: 0.01, visible: false},
		//  { name: 'form_distance', caption: 'Form-Abstand', type: 'float', initial: 6.6},
		//  { name: 'line_height', caption: 'Zeilen-Höhe', type: 'float', initial: 10.8, visible: false },
	  	{ name: 'dot_height', caption: 'Altura do ponto [default: 0.75mm]:', type: 'range', initial: 0.75,  begin: 0.6, end: 0.8, step: 0.01},
		{ name: 'dot_diameter', caption: 'Diâmetro do ponto [default: 1.9mm]:', type: 'range', initial: 1.9, begin: 1.2, end: 2.0, step: 0.01 },
	
		{ name: 'plate_thickness', caption: 'Espessura da placa (mm):', type: 'float', initial: 2.0 },
		{ name: 'plate_margin', caption: 'Margem da placa (mm):', type: 'float', initial: 5.0 },
	
		{ name: 'reference_corner', caption: 'Gerar canto de referência ?', type: 'bool', initial: true },
		{ name: 'stands', caption: 'Gerar apoios para impressão ?', type: 'bool', initial: true },

		{ name: 'resolution', caption: 'Resolução', type: 'int', initial: 16, visible: false },
		{ name: 'dot_shape', caption: 'Formato do ponto', type: 'choice', values: ['sphere', 'cylinder', 'smooth'], captions: ['Esfera', 'Cilindro', 'Plano'], initial: 'smooth' , visible: false },
		//{ name: 'debug_dot', caption: 'Debug dot', type: 'bool', initial: false, visible: debug }
	];
	
	return parameterDefinitions;
}

function main(params)
{
	log("start");
	
	parameters = params;
	master_dot = null;
	
	var formFactor = parameters.form_size / 10.0;
	parameters.dot_distance = parameters.dot_distance + 0.7 * formFactor;
	parameters.form_distance = parameters.dot_distance * 2.5;
	parameters.line_height = parameters.dot_distance * 4.0;
	
	var result;
	if (parameters.debug_dot)
		result = sized_dot().scale([3, 3, 3]);
	else
		result = generate(parameters.text);
	
	log("finish");
	
	return result;
}
