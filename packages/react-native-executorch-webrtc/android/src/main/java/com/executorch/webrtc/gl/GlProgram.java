package com.executorch.webrtc.gl;

import android.opengl.GLES20;
import java.util.HashMap;
import java.util.Map;

public class GlProgram {
    private final int programId;
    private final Map<String, Integer> attributeLocations = new HashMap<>();
    private final Map<String, Integer> uniformLocations = new HashMap<>();

    public GlProgram(String vertexSource, String fragmentSource) {
        int vertexShader = loadShader(GLES20.GL_VERTEX_SHADER, vertexSource);
        int fragmentShader = loadShader(GLES20.GL_FRAGMENT_SHADER, fragmentSource);
        programId = GLES20.glCreateProgram();
        GLES20.glAttachShader(programId, vertexShader);
        GLES20.glAttachShader(programId, fragmentShader);
        GLES20.glLinkProgram(programId);
        GLES20.glDeleteShader(vertexShader);
        GLES20.glDeleteShader(fragmentShader);
    }

    public void use() {
        GLES20.glUseProgram(programId);
    }

    public int getAttributeLocation(String name) {
        Integer loc = attributeLocations.get(name);
        if (loc == null) {
            loc = GLES20.glGetAttribLocation(programId, name);
            attributeLocations.put(name, loc);
        }
        return loc;
    }

    public void setUniformMatrix4(String name, float[] matrix) {
        GLES20.glUniformMatrix4fv(getUniformLocation(name), 1, false, matrix, 0);
    }

    public void setUniform1i(String name, int value) {
        GLES20.glUniform1i(getUniformLocation(name), value);
    }

    public void setUniform2f(String name, float x, float y) {
        GLES20.glUniform2f(getUniformLocation(name), x, y);
    }

    public void setUniform1f(String name, float value) {
        GLES20.glUniform1f(getUniformLocation(name), value);
    }

    public void setUniform1fv(String name, float[] values) {
        GLES20.glUniform1fv(getUniformLocation(name), values.length, values, 0);
    }

    public void bindTexture(String uniformName, int textureUnit, int textureId, int textureTarget) {
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0 + textureUnit);
        GLES20.glBindTexture(textureTarget, textureId);
        setUniform1i(uniformName, textureUnit);
    }

    public void release() {
        GLES20.glDeleteProgram(programId);
        attributeLocations.clear();
        uniformLocations.clear();
    }

    private int getUniformLocation(String name) {
        Integer loc = uniformLocations.get(name);
        if (loc == null) {
            loc = GLES20.glGetUniformLocation(programId, name);
            uniformLocations.put(name, loc);
        }
        return loc;
    }

    private static int loadShader(int type, String source) {
        int shader = GLES20.glCreateShader(type);
        GLES20.glShaderSource(shader, source);
        GLES20.glCompileShader(shader);
        return shader;
    }
}
