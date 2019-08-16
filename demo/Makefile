run: demo
	./demo

demo: clear
	gcc demo.c -o demo solver.c -I/usr/include -L/usr/local/lib -lGLU -lGL -lglut

clear:
	rm demo
