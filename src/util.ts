export class Util {
    public static async sleep(ms) {
        await new Promise((resolve) => setTimeout(resolve, ms));
    }
}
