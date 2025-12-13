import * as Jimp from 'jimp';

/**
 * Provides tools for adding annotations to images using the Jimp library.
 * Capable of resizing images, drawing rectangles, and placing text labels with backgrounds.
 */
class ImageAnnotator {
    private static readonly FONT_SIZE = 12;
    private static readonly SHORT_SIDE_MAX_SIZE = 768;
    private static readonly LONG_SIDE_MAX_SIZE = 2048;
    private static readonly AVERAGE_CHAR_WIDTH = ImageAnnotator.FONT_SIZE * 0.6;
    private static readonly PADDING_PIXELS = 10;

    private image!: Jimp;
    private originalWidth!: number;
    private originalHeight!: number;
    private imageWidth!: number;
    private imageHeight!: number;

    private borderColor: number;
    private backgroundColor: number;

    constructor(private imageBuffer: Buffer) {
        this.borderColor = Jimp.cssColorToHex('rgba(255, 0, 0, 0.75)');
        this.backgroundColor = Jimp.cssColorToHex('rgba(255, 255, 255, 0.75)');
    }

    private async initialize(): Promise<void> {
        this.image = await Jimp.read(this.imageBuffer);
        this.originalWidth = this.image.bitmap.width;
        this.originalHeight = this.image.bitmap.height;
        [this.imageWidth, this.imageHeight] = this.calculateNewDimensions(this.originalWidth, this.originalHeight);
        this.image.resize(this.imageWidth, this.imageHeight);
    }

    public async annotate(
        tracks: Array<{ x: number; y: number; w: number; h: number; text: string }>,
    ): Promise<Buffer> {
        await this.initialize();

        const font = await Jimp.loadFont(Jimp.FONT_SANS_12_BLACK);

        for (const track of tracks) {
            // Adjust coordinates for resized image
            const adjustedTrack = this.adjustTrackCoordinates(track);

            // Draw the rectangle (border) with thickness
            this.drawRectangle(adjustedTrack.x, adjustedTrack.y, adjustedTrack.w, adjustedTrack.h);

            // Initial position for text
            let textX = adjustedTrack.x;
            let textY = adjustedTrack.y - ImageAnnotator.FONT_SIZE - 4; // Place text slightly above the rectangle

            // Adjust text position if it goes out of bounds
            [textX, textY] = this.fitTextWithinBounds(
                textX,
                textY,
                adjustedTrack.text,
                adjustedTrack.y,
                adjustedTrack.h,
            );

            // Draw the text background
            await this.drawTextBackground(textX, textY, adjustedTrack.text);

            // Add the text
            this.createText(textX, textY, adjustedTrack.text, font);
        }

        return await this.image.getBufferAsync(Jimp.MIME_PNG);
    }

    private calculateNewDimensions(width: number, height: number): [number, number] {
        const scaleForShortestSide =
            width < height ? ImageAnnotator.SHORT_SIDE_MAX_SIZE / width : ImageAnnotator.SHORT_SIDE_MAX_SIZE / height;
        const scaleForLongestSide =
            width > height ? ImageAnnotator.LONG_SIDE_MAX_SIZE / width : ImageAnnotator.LONG_SIDE_MAX_SIZE / height;

        const scale = Math.min(scaleForShortestSide, scaleForLongestSide, 1);

        const downsizedWidth = Math.round(width * scale);
        const downsizedHeight = Math.round(height * scale);

        return [downsizedWidth, downsizedHeight];
    }

    private adjustTrackCoordinates(track: { x: number; y: number; w: number; h: number; text: string }): {
        x: number;
        y: number;
        w: number;
        h: number;
        text: string;
    } {
        const scaleX = this.imageWidth / this.originalWidth;
        const scaleY = this.imageHeight / this.originalHeight;

        return {
            x: Math.round(track.x * scaleX),
            y: Math.round(track.y * scaleY),
            w: Math.round(track.w * scaleX),
            h: Math.round(track.h * scaleY),
            text: track.text,
        };
    }

    private drawRectangle(x: number, y: number, width: number, height: number): void {
        this.image.scan(x, y, width, height, (xx: number, yy: number, idx: number) => {
            if (xx === x || xx === x + width - 1 || yy === y || yy === y + height - 1) {
                this.image.bitmap.data.writeUInt32BE(this.borderColor, idx);
            }
        });
    }

    private async drawTextBackground(x: number, y: number, text: string): Promise<void> {
        const textWidth = this.getTextWidth(text);
        const textHeight = ImageAnnotator.FONT_SIZE;

        // Create a new background image with additional padding for text. The background extends 4 pixels beyond the text dimensions for padding.
        const background = new Jimp(textWidth + 4, textHeight + 4, this.backgroundColor);

        // Position the background centered around the text coordinates, offset by 2 pixels to ensure text is centered within the background.
        this.image.composite(background, x - 2, y - 2, {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacitySource: 0.75, // Adjust transparency here
            opacityDest: 1,
        });
    }

    private createText(x: number, y: number, text: string, font: any): void {
        this.image.print(font, x, y, {
            text: text,
            alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
            alignmentY: Jimp.VERTICAL_ALIGN_TOP,
        });
    }

    private fitTextWithinBounds(
        x: number,
        y: number,
        text: string,
        rectY: number,
        rectHeight: number,
    ): [number, number] {
        const textWidth = this.getTextWidth(text);
        const textHeight = ImageAnnotator.FONT_SIZE;

        // Adjust position if text goes beyond the right edge
        if (x + textWidth > this.imageWidth) {
            x = this.imageWidth - textWidth - ImageAnnotator.PADDING_PIXELS; // 10 pixels padding from the edge
        }

        // Adjust position if text goes beyond the top edge
        if (y - textHeight < 0) {
            // Try placing text below the rectangle
            y = rectY + rectHeight + textHeight + ImageAnnotator.PADDING_PIXELS; // 10 pixels padding below the rectangle
        }

        // Adjust position if text goes beyond the bottom edge
        if (y + textHeight > this.imageHeight) {
            y = this.imageHeight - textHeight - ImageAnnotator.PADDING_PIXELS; // 10 pixels padding from the bottom
        }

        return [x, y];
    }

    private getTextWidth(text: string): number {
        // Approximate average width of a character in the font being used
        return text.length * ImageAnnotator.AVERAGE_CHAR_WIDTH;
    }
}

export default ImageAnnotator;
