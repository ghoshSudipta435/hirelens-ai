import CircuitBreaker from 'opossum';
import { logger } from '../config/logger';

export function createCircuitBreaker<TI extends unknown[], TR>(
  action: (...args: TI) => Promise<TR>,
  options: CircuitBreaker.Options = {},
): CircuitBreaker<TI, TR> {
  const defaultOptions: CircuitBreaker.Options = {
    timeout: 10000, // If action takes longer than 10 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
    resetTimeout: 30000, // After 30 seconds, try again
  };

  const breaker = new CircuitBreaker(action, { ...defaultOptions, ...options });

  breaker.on('open', () => {
    logger.warn({ name: breaker.name }, 'Circuit breaker opened');
  });

  breaker.on('halfOpen', () => {
    logger.info({ name: breaker.name }, 'Circuit breaker half-open');
  });

  breaker.on('close', () => {
    logger.info({ name: breaker.name }, 'Circuit breaker closed');
  });

  breaker.on('fallback', () => {
    logger.warn({ name: breaker.name }, 'Circuit breaker fallback triggered');
  });

  return breaker;
}
