import { Matrix4D, Matrix3D } from "../main/math";

test('safsd', () => {
  expect(1).toBe(1);
})

test('matrix4d mul', () => {
  const m1 = new Matrix4D([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ]);
  const m2 = new Matrix4D([ 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1 ]);

  m1.mul(m2);
  
  expect(m1.data).toEqual([
    80, 70, 60, 50,
    240, 214, 188, 162,
    400, 358, 316, 274,
    560, 502, 444, 386
  ])
})

test('matrix3d mul', () => {
  const m1 = new Matrix3D([ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);
  const m2 = new Matrix3D([ 9, 8, 7, 6, 5, 4, 3, 2, 1 ]);

  m1.mul(m2);

  expect(m1.data).toEqual([
    30, 24, 18,
    84, 69, 54,
    138, 114, 90
  ])
})