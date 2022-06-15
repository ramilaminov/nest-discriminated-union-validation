import { Body, Controller, Get, Post } from '@nestjs/common';
import { ClassConstructor, Type } from 'class-transformer';
import { IsIn, IsNotEmpty, ValidateNested } from 'class-validator';
import { AppService } from './app.service';

class NewPatient {
  kind: 'new';

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;
}

class ExistingPatient {
  kind: 'existing';

  @IsNotEmpty()
  patientId: string;
}

const DiscriminatedType = (types: {
  [kind: string]: ClassConstructor<any>
}) => Type(
  () => {
    const kinds = Object.keys(types);
    class Kindable {
      @IsIn(kinds)
      kind: string;
    }
    return Kindable;
  },
  {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'kind',
      subTypes: Object.entries(types).map(
        ([name, value]) => ({ name, value })
      )
    }
  }
);

class Order {
  @IsNotEmpty()
  @ValidateNested()
  @DiscriminatedType({
    'new': NewPatient,
    'existing': ExistingPatient
  })
  patient: NewPatient | ExistingPatient;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/orders')
  createOrder(@Body() order: Order) {
    const patient = order.patient;

    switch (patient.kind) {
      case 'new' :
        return `New patient: ${patient.firstName} ${patient.lastName}`;
      case 'existing':
        return `Existing patient: ${patient.patientId}`;
    }
  }
}
