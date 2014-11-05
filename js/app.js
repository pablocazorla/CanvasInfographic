// App

var Ebola = Infographic({
	id: 'myCanvas'
});


var cuadro = Infographic.Sprite();

var cuadro2 = Infographic.Sprite({
	draw: function(c) {
		c.fillStyle = 'blue';
		c.font='14px sans-serif';
		c.textAlign= 'right';
		Infographic.Shape.Text(c);
	}
});


Ebola.append(cuadro);

cuadro.append(cuadro2);



cuadro.x = 10;
cuadro.y = 50;
/*
cuadro.rotation = -.1;
cuadro2.rotation = .5;
cuadro.scale = .5;



setTimeout(function() {
	cuadro.animate({
		x: 500
	}, 1500, function() {
		console.log('Animó');
		cuadro2.animate({
			scale: 2
		}, 300);
	});
}, 5000);
*/