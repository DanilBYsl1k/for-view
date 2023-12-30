import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  startWith,
  switchMap,
  tap, } from 'rxjs';
import { Store } from '@ngrx/store';

import { loading } from '@modules/account/store/selector/account.selector';
import { VehicleService } from '@modules/order-policy/services/vehicle.service';
import { EEngine } from '@shared/enums/engine.enum';
import { IAppState } from '@shared/interfaces/app-state.interface';
import { DictionaryService } from '@shared/services/dictionary.service';
import { SvgIconRegisterService } from '@shared/services/svg-icon-register.service';
import { ValidationClass } from '@shared/validations/validation.class';
import { createGarage } from '@modules/account/store/actions/account.action';

interface IForm {
  vin: FormControl<string | null>;
  mark: FormControl<string | null>;
  model: FormControl<string | null>;
  year: FormControl<string | null>;
  plateNumber: FormControl<string | null>;
  type: FormControl<string | null>;
  engineVolume: FormControl<string | null>;
  codeKoatuu: FormControl<string | null>;
  zipCode: FormControl<string | null>;
  registrationAddress: FormControl<string | null>;
}

const PATTERN = new RegExp(/^[АВЕКМНОРСТУХABEKMHOPCTYX]{2}\d{4}[АВЕКМНОРСТУХABEKMHOPCTYX]{2}$/);

@Component({
  selector: 'vtm-add-vehicle',
  templateUrl: './add-vehicle.component.html',
  styleUrls: ['./add-vehicle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddVehicleComponent implements OnInit {
  markList$ = this.dictionary.getCarBrands();
  modelList$!: Observable<never[]>;
  isLoading$ = this.store.select(loading);

  garageId = this.activeRouter.snapshot.queryParamMap.get('garageId');
  form!: FormGroup<IForm>;

  readonly engineType = this.dictionary.engineType();

  constructor(
    private fb: FormBuilder,
    private store: Store<IAppState>,
    private vehicleService: VehicleService,
    private dictionary : DictionaryService,
    private svgService: SvgIconRegisterService,
    private activeRouter: ActivatedRoute,
  ) {
    this.svgService.registerIcons(['vehicle', 'engine', 'location', 'calendar']);
  }

  ngOnInit(): void {
    this.initialForm();
    this.modelList$ = this.modelList();
    this.setupZipCodeListener();
  }

  onSelectType(type: EEngine): void {
    const { engineVolume } = this.vehicleService.getEngineType(type);

    this.form.controls.engineVolume.patchValue(engineVolume);
  }

  private setupZipCodeListener(): void {
    this.form.controls.zipCode.valueChanges.pipe(
      debounceTime(500),
      filter(() => this.form.controls.zipCode.valid),
      distinctUntilChanged(),
      switchMap((value) => this.dictionary.getByZipCode(value as string).pipe(
        catchError(() => of(null))
      ))
    ).subscribe((resp) => {
      if (resp) {
        const {region, area, typeOfSettlement, settlement} = resp;
        this.form.patchValue({...resp, registrationAddress: `${region} ${area} ${typeOfSettlement} ${settlement}`});
      }
    });
  }

  private modelList(): Observable<never[]> {
    return this.form.controls.mark.valueChanges.pipe(
      distinctUntilChanged(),
      tap(() => this.form.controls.model.patchValue('')),
      startWith(this.form.value.mark),
      filter(value => !!value),
      switchMap(mark => this.markList$.pipe(
        map(markList => markList.find((markVehicle: { name: string }) => markVehicle.name === mark)),
        switchMap(modeId => this.dictionary.getCarBrandsCarModel(modeId?.['id']!).pipe(catchError((error) => of(error))))
      )),
      catchError(() => of([]))
    );
  }

  private initialForm(): void {
    this.form = this.fb.group({
      engineVolume: this.fb.control('', [Validators.required]),
      model: this.fb.control('', [Validators.required]),
      mark: this.fb.control('', [Validators.required]),
      plateNumber: this.fb.control('', [Validators.required, Validators.pattern(PATTERN)]),
      type: this.fb.control('', [Validators.required]),
      year: this.fb.control('', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(4)]),
      vin: this.fb.control('',
        [Validators.required],
        [ValidationClass.validationVINCode(this.vehicleService)]
      ),
      codeKoatuu: this.fb.control('', Validators.required),
      registrationAddress: this.fb.control('',[Validators.required, Validators.nullValidator]),
      zipCode: this.fb.control('',[
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5),],
        [ValidationClass.validationZipCode(this.vehicleService)])
    });
  }
}

