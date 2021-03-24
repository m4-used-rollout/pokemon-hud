function throttle<T extends (...args: any[]) => void>(func: T, waitMS: number = 1) {
    let deferred: any = 0;
    let running = false;
    const wrapper = (...args: any[]) => {
        if (!running) {
            running = true;
            func(...args);
            setTimeout(() => {
                running = false;
            }, waitMS);
        }
        else {
            clearTimeout(deferred);
            deferred = setTimeout(() => wrapper(...args), waitMS);
        }
    }
    return wrapper as T;
}