function parse(data:string) {
  const vertices:any[] = [];
  const normals:any[] = [];
  const faces:any[] = [];

  data.split('\n').forEach((line, i) => {
    var tokens = line.split(/\s+/);

    switch (tokens[0]) {
      case 'v': // vertex
        vertices.push([parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])]);
        break;
      case 'vn': // normarl
        normals.push([parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])]);
        break;
      case 'f': // face (vertex/[texute]/normal)
        const f = [];
        for (var i = 1; i < tokens.length; i++) {
          const face = tokens[i].split('/');
          f[f.length] = {v: parseInt(face[0]), t: parseInt(face[1]), n: parseInt(face[2])};
        }
        faces[faces.length] = f;
        break;
      case 'vt': // vertex texture
        break;
      default:
    }
  });

  const indecies = [];
  for (const f of faces) {
    for (const v of f) {
      indecies.push(v.v);
    }
  }
 
  return faces.map(v => {
    const v1 = vertices[v[0].v - 1];
    const v2 = vertices[v[1].v - 1];
    const v3 = vertices[v[2].v - 1];
    const n1 = normals[v[0].n - 1];
    const n2 = normals[v[1].n - 1];
    const n3 = normals[v[2].n - 1];

    return {
      v: [v1, v2, v3],
      n: [n1, n2, n3],
      t: []
    };
  });
}

export default class ObjLoader {
  load(path:string) {
    return fetch(path)
    .then(res => res.text())
    .then(parse)
  }
}