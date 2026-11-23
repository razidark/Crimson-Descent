export class Camera {
  public scrollX: number = 0;
  private shakeIntensity: number = 0;
  private shakeDecay: number = 0.85;
  public currentShakeX: number = 0;
  public currentShakeY: number = 0;

  public update(dt: number, hasEnemies: boolean) {
    // 1. Camera Scrolling (Parallax)
    if (hasEnemies) {
      // Return camera to fight position
      this.scrollX += (0 - this.scrollX) * 0.08;
    } else {
      // Scroll forward to simulate walking
      this.scrollX += 0.04 * dt;
    }

    // 2. Screen Shake decay
    if (this.shakeIntensity > 0.1) {
      this.currentShakeX = (Math.random() - 0.5) * this.shakeIntensity;
      this.currentShakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.currentShakeX = 0;
      this.currentShakeY = 0;
      this.shakeIntensity = 0;
    }
  }

  public triggerShake(intensity: number) {
    this.shakeIntensity = Math.min(15, this.shakeIntensity + intensity);
  }
}
