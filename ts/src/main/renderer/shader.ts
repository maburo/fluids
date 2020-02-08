interface AttributeMap {
  [key: string]: number;
}

export default interface Shader {
  readonly name:string;
  attr:AttributeMap;
  uniform: AttributeMap;
  bind():void;
}

export interface ShaderInput {
  readonly name:string;
  readonly vertexSrc:string;
  readonly fragmentSrc:string;
  readonly attributes?:string[];
  readonly uniforms?:string[];
}
