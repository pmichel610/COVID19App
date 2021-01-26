import { TestBed } from '@angular/core/testing';

import { COVID19Service } from './covid19.service';

describe('COVID19Service', () => {
  let service: COVID19Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(COVID19Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
