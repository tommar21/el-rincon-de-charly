import { Application, Container, Graphics } from 'pixi.js';
import type Matter from 'matter-js';

interface BallInfo {
  body: Matter.Body;
}

export class PixiRenderer {
  private app: Application | null = null;
  private staticLayer: Container | null = null;
  private dynamicLayer: Container | null = null;
  private pinsGraphics: Graphics | null = null;
  private isInitialized = false;
  private initError: Error | null = null;

  async init(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {
    // Validate canvas and dimensions
    if (!canvas || width <= 0 || height <= 0) {
      throw new Error('Invalid canvas or dimensions');
    }

    // Ensure canvas has proper dimensions set
    canvas.width = width;
    canvas.height = height;

    try {
      this.app = new Application();

      await this.app.init({
        canvas,
        width,
        height,
        autoDensity: true,
        resolution: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
        backgroundAlpha: 0,
        antialias: true,
        preference: 'webgl',
      });

      this.staticLayer = new Container();
      this.dynamicLayer = new Container();
      this.app.stage.addChild(this.staticLayer);
      this.app.stage.addChild(this.dynamicLayer);

      this.isInitialized = true;
    } catch (error) {
      this.initError = error instanceof Error ? error : new Error(String(error));

      // Try fallback with simpler settings
      try {
        this.app = new Application();

        await this.app.init({
          canvas,
          width,
          height,
          autoDensity: false,
          resolution: 1,
          backgroundAlpha: 0,
          antialias: false,
          preference: 'webgl',
        });

        this.staticLayer = new Container();
        this.dynamicLayer = new Container();
        this.app.stage.addChild(this.staticLayer);
        this.app.stage.addChild(this.dynamicLayer);

        this.isInitialized = true;
        this.initError = null;
      } catch {
        throw this.initError;
      }
    }
  }

  getInitError(): Error | null {
    return this.initError;
  }

  renderPins(bodies: Matter.Body[], pinSize: number): void {
    if (!this.staticLayer || !this.isInitialized) return;

    // Create or reuse pins Graphics
    if (!this.pinsGraphics) {
      this.pinsGraphics = new Graphics();
      this.staticLayer.addChild(this.pinsGraphics);
    }
    this.pinsGraphics.clear();

    for (const body of bodies) {
      if (body.label.startsWith('pin-')) {
        this.pinsGraphics.circle(
          body.position.x,
          body.position.y,
          body.circleRadius || pinSize
        );
      }
    }
    this.pinsGraphics.fill({ color: 0x9ca3af }); // gray-400
  }

  renderBalls(balls: Map<string, BallInfo>): void {
    if (!this.dynamicLayer || !this.isInitialized) return;

    this.dynamicLayer.removeChildren();

    balls.forEach((ballInfo) => {
      const { body } = ballInfo;
      if (body.circleRadius) {
        const circle = new Graphics();
        circle.circle(body.position.x, body.position.y, body.circleRadius);
        circle.fill({ color: 0xfbbf24 }); // yellow/amber
        this.dynamicLayer!.addChild(circle);
      }
    });
  }

  resize(width: number, height: number): void {
    if (!this.app || !this.isInitialized) return;
    this.app.renderer.resize(width, height);
  }

  addTickerCallback(callback: () => void): void {
    if (!this.app || !this.isInitialized) return;
    this.app.ticker.add(callback);
  }

  removeTickerCallback(callback: () => void): void {
    if (!this.app || !this.isInitialized) return;
    this.app.ticker.remove(callback);
  }

  destroy(): void {
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }
    this.staticLayer = null;
    this.dynamicLayer = null;
    this.pinsGraphics = null;
    this.isInitialized = false;
  }

  get ready(): boolean {
    return this.isInitialized;
  }
}
