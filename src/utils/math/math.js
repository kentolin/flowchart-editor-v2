/**
 * math.js - Mathematical utilities
 */

export class MathUtils {
  /**
   * Generate random number between min and max
   */
  static random(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generate random integer between min and max
   */
  static randomInt(min, max) {
    return Math.floor(this.random(min, max + 1));
  }

  /**
   * Clamp value between min and max
   */
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Linear interpolation
   */
  static lerp(start, end, t) {
    return start + (end - start) * t;
  }

  /**
   * Inverse lerp - get t value for given value
   */
  static inverseLerp(start, end, value) {
    return (value - start) / (end - start);
  }

  /**
   * Map value from one range to another
   */
  static map(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  /**
   * Round to specified decimal places
   */
  static round(value, decimals = 0) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Check if two numbers are approximately equal
   */
  static approximately(a, b, epsilon = 0.0001) {
    return Math.abs(a - b) < epsilon;
  }

  /**
   * Calculate percentage
   */
  static percentage(value, total) {
    return (value / total) * 100;
  }

  /**
   * Calculate average
   */
  static average(...numbers) {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Calculate median
   */
  static median(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Calculate standard deviation
   */
  static standardDeviation(numbers) {
    const avg = this.average(...numbers);
    const squareDiffs = numbers.map((n) => Math.pow(n - avg, 2));
    const avgSquareDiff = this.average(...squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Degrees to radians
   */
  static degToRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Radians to degrees
   */
  static radToDeg(radians) {
    return (radians * 180) / Math.PI;
  }

  /**
   * Check if number is even
   */
  static isEven(n) {
    return n % 2 === 0;
  }

  /**
   * Check if number is odd
   */
  static isOdd(n) {
    return n % 2 !== 0;
  }

  /**
   * Calculate greatest common divisor
   */
  static gcd(a, b) {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  /**
   * Calculate least common multiple
   */
  static lcm(a, b) {
    return (a * b) / this.gcd(a, b);
  }

  /**
   * Check if number is prime
   */
  static isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;

    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }

  /**
   * Calculate factorial
   */
  static factorial(n) {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }

  /**
   * Calculate fibonacci number
   */
  static fibonacci(n) {
    if (n <= 1) return n;
    let a = 0,
      b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  /**
   * Generate UUID
   */
  static uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generate short ID
   */
  static shortId(length = 8) {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  }

  /**
   * Normalize value between 0 and 1
   */
  static normalize(value, min, max) {
    return (value - min) / (max - min);
  }

  /**
   * Ease in quad
   */
  static easeInQuad(t) {
    return t * t;
  }

  /**
   * Ease out quad
   */
  static easeOutQuad(t) {
    return t * (2 - t);
  }

  /**
   * Ease in out quad
   */
  static easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
   * Smooth step
   */
  static smoothStep(t) {
    return t * t * (3 - 2 * t);
  }

  /**
   * Smoother step
   */
  static smootherStep(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
}
